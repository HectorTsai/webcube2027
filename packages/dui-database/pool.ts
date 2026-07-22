// Data Pool — L2/L3 multi-layer data access
// Global singleton, import directly by all services
//
// Architecture:
//   L1 (config KV) → stores L2 connection info, no longer a database fallback
//   L2 (SYSTEM)    → central database (read L2 connection info from L1 store)
//   L3 (HOST)      → per-site database via hostname lookup (from L2 site data)
//
// Query routing: L3 (specific host) → other L3 → L2 (SYSTEM)
// No L1 fallback — L1 is a config store, not a database.
//
// Lifecycle:
//   await dataPool.initL1()       // init L1 KV store + ensure crypto key
//   await dataPool.initL2()       // read L2 conn info from L1 → connect
//   await dataPool.initL3(host)   // auto-triggered on first query for that host

import type { DatabaseAdapter, QueryOptions } from './adapter/adapter-interface.ts';
import type { L2ConnectionInfo } from './index.ts';
import { L1Store } from './l1-store.ts';
import { info, error } from './logger.ts';
import { ensureKey, decrypt } from '@dui/util';

// ── Query Result ──

type SourceLevel = 'L2' | 'L3';

/**
 * Query result returned by all data pool operations.
 * Contains the result data, source layer, success status, and optional error message.
 */
export interface QueryResult<T> {
  data: T | null;
  source: SourceLevel;
  success: boolean;
  error?: string;
}

// ── Pool Core ──

/**
 * Multi-layer data pool with L2/L3 routing.
 *
 * - L1 (CONFIG): KV store (JSON file) for system settings + L2 connection info
 * - L2 (SYSTEM): Central database (MySQL, PostgreSQL, MongoDB, etc.)
 * - L3 (HOST): Per-site database via hostname lookup
 *
 * Query degradation: L3 → other L3 → L2. No L1 fallback.
 */
export class PoolCore {
  private 連線池 = new Map<string, DatabaseAdapter>();
  private 初始化中 = { L2: false, L3: new Set<string>() };
  private _l1!: L1Store;

  // ═══════════════════════════════════════════
  //  L1 Store accessor
  // ═══════════════════════════════════════════

  /**
   * Access the L1 config store.
   * Returns `null` if `initL1()` has not been called yet.
   */
  get config(): L1Store | null {
    return this._l1 ?? null;
  }

  // ═══════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════

  /**
   * Initialize L1 — the config KV store.
   *
   * Creates the L1Store (backed by a JSON file) and ensures the
   * encryption key exists (auto-generated on first run).
   */
  async initL1(dataDir?: string): Promise<void> {
    if (this._l1) return;
    ensureKey(dataDir); // ensure crypto key exists before L1 store
    this._l1 = new L1Store(dataDir ? `${dataDir}/l1.json` : undefined);
    await this._l1.init();
  }

  /**
   * Initialize L2 (SYSTEM). Reads connection info from L1 and connects.
   */
  async initL2(): Promise<void> {
    if (this.連線池.has('SYSTEM')) return;

    if (this.初始化中.L2) {
      while (this.初始化中.L2) await new Promise(r => setTimeout(r, 100));
      return;
    }

    this.初始化中.L2 = true;
    try {
      const connStr = await this._l1?.get('l2_connection');
      if (!connStr) { this.初始化中.L2 = false; return; }

      const decrypted = await decrypt(connStr);
      const l2Info: L2ConnectionInfo = JSON.parse(decrypted);

      const l2 = await this.buildAdapter(l2Info);
      if (!l2) { this.初始化中.L2 = false; return; }

      this.連線池.set('SYSTEM', l2);
      await info('Pool', 'L2 connected');
    } catch (err) {
      await error('Pool', `L2 init failed: ${err}`);
    } finally {
      this.初始化中.L2 = false;
    }
  }

  /**
   * Initialize L3 for a specific host. Reads connection info from L2's site data.
   */
  async initL3(host: string): Promise<void> {
    if (this.連線池.has(host)) return;

    if (this.初始化中.L3.has(host)) {
      while (this.初始化中.L3.has(host)) await new Promise(r => setTimeout(r, 100));
      return;
    }

    this.初始化中.L3.add(host);
    try {
      const l2 = this.連線池.get('SYSTEM');
      if (!l2) { this.初始化中.L3.delete(host); return; }

      const rows = await l2.queryByField('網站資訊', { field: '網域', value: host });
      const 網站資料 = rows[0];
      if (!網站資料) { this.初始化中.L3.delete(host); return; }

      let conn: L2ConnectionInfo | null = null;
      if (網站資料.資料庫連線) {
        try { conn = JSON.parse(網站資料.資料庫連線 as string) as L2ConnectionInfo; } catch { /* skip */ }
      }
      if (!conn) { this.初始化中.L3.delete(host); return; }

      const l3 = await this.buildAdapter(conn);
      if (l3) {
        this.連線池.set(host, l3);
        await info('Pool', `L3 connected (${host})`);
      }
    } finally {
      this.初始化中.L3.delete(host);
    }
  }

  // ═══════════════════════════════════════════
  //  Public Query API (L3 → L2 degraded)
  // ═══════════════════════════════════════════

  /**
   * Get a single record by its composite ID.
   * Searches through L3 → L2 and returns the first match.
   */
  async getById<T extends { id: string }>(id: string, host?: string): Promise<QueryResult<T>> {
    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        const raw = await db.getById(id);
        if (raw) {
          return { data: raw as T, source: this.keyToLayer(key), success: true };
        }
      } catch { /* degrade to next layer */ }
    }

    return { data: null, source: 'L3', success: false, error: 'Not found in any available layer' };
  }

  /**
   * List records from a collection (table), optionally filtered by model type.
   *
   * Supports two call signatures:
   * - list(collection, modelType?, options?, host?)  ← preferred
   * - list(collection, limit, offset, host?)         ← backward compat
   */
  async list<T extends { id: string }>(
    collection: string,
    modelType?: string | number,
    options?: QueryOptions | number,
    host?: string
  ): Promise<QueryResult<T[]>> {
    // Backward compat: list(collection, limit, offset)
    if (typeof modelType === 'number') {
      options = { limit: modelType, offset: (options as number) ?? 0 };
      modelType = undefined;
    }
    const opts: QueryOptions = (options as QueryOptions) ?? {};

    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        const rows = await db.list(collection, modelType as string | undefined, opts);
        if (rows.length > 0) {
          return { data: rows as T[], source: this.keyToLayer(key), success: true };
        }
      } catch { /* degrade */ }
    }

    return { data: [], source: 'L3', success: true };
  }

  /**
   * Merge all layers (deduplicated, higher layer wins).
   * Unlike list(), this returns data from ALL available layers.
   */
  async listAll<T extends { id: string }>(
    collection: string,
    modelType?: string | number,
    options?: QueryOptions | number,
    host?: string
  ): Promise<QueryResult<T[]>> {
    if (typeof modelType === 'number') {
      options = { limit: modelType, offset: (options as number) ?? 0 };
      modelType = undefined;
    }
    const opts: QueryOptions = (options as QueryOptions) ?? {};

    const allData: T[] = [];
    const seen = new Set<string>();

    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        const rows = await db.list(collection, modelType as string | undefined, opts);
        for (const row of rows) {
          const rid = row.id as string;
          if (seen.has(rid)) continue;
          seen.add(rid);
          allData.push(row as T);
        }
      } catch { /* skip failed layer */ }
    }

    return { data: allData, source: 'L3', success: true };
  }

  /**
   * Query records by field value, optionally filtered by model type.
   */
  async queryByField<T extends Record<string, unknown>>(
    collection: string,
    filter: { field: string; value: string },
    modelType?: string,
    host?: string,
  ): Promise<T[]> {
    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        const rows = await db.queryByField(collection, filter, modelType);
        if (rows.length > 0) {
          return rows as T[];
        }
      } catch { /* degrade */ }
    }
    return [];
  }

  /**
   * List all distinct model types within a collection.
   * Parses the 2nd segment of composite IDs.
   */
  async listModelTypes(collection: string, host?: string): Promise<string[]> {
    const types = new Set<string>();
    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        if (db.listModelTypes) {
          const t = await db.listModelTypes(collection);
          for (const type of t) types.add(type);
        }
      } catch { /* skip */ }
    }
    return [...types].sort();
  }

  /**
   * Upsert (create or update) a record in the target layer.
   * If the record exists it is updated; otherwise a new record is created.
   *
   * @param collection - Collection (table) name
   * @param data - Record data (may include id in collection:model:nanoid format)
   * @param host - Optional: L3 host
   */
  async upsert<T extends { id?: string }>(
    collection: string,
    data: Partial<T>,
    host?: string
  ): Promise<QueryResult<T>> {
    const key = this.writeLayer(host);
    const db = this.連線池.get(key);
    if (!db) return { data: null, source: 'L3', success: false, error: 'No writable database' };

    const { id, isUpdate } = await this.resolveId(collection, data);
    const updateData = { ...data, id } as Record<string, unknown>;

    try {
      if (isUpdate) {
        const existing = await db.getById(id);
        if (!existing) {
          const created = await db.create(collection, id, updateData);
          if (created) {
            return { data: created as T, source: this.keyToLayer(key), success: true };
          }
        }
      }

      const result = isUpdate
        ? await db.update(collection, id, updateData)
        : await db.create(collection, id, updateData);
      if (result) {
        return { data: result as T, source: this.keyToLayer(key), success: true };
      }

      return { data: null, source: this.keyToLayer(key), success: false, error: 'Write failed' };
    } catch (err) {
      return { data: null, source: this.keyToLayer(key), success: false, error: String(err) };
    }
  }

  /**
   * Delete a record by composite ID.
   *
   * If the record exists in a different layer than the delete target,
   * the operation is rejected — you cannot delete a record from the wrong layer.
   * Layer-level access control is the responsibility of the API Gateway layer.
   */
  async delete(id: string, host?: string): Promise<QueryResult<boolean>> {
    const existing = await this.getById(id, host);

    const key = this.writeLayer(host);
    const targetLayer = this.keyToLayer(key);

    // Layer mismatch: record lives in one layer but delete targets another
    if (existing.success && existing.source !== targetLayer) {
      return { data: false, source: existing.source, success: false, error: `Record exists in ${existing.source} but delete targets ${targetLayer}` };
    }

    const db = this.連線池.get(key);
    if (!db) return { data: false, source: 'L3', success: false, error: 'No writable database' };

    try {
      const ok = await db.delete(id) as boolean;
      return { data: ok, source: targetLayer, success: ok };
    } catch (err) {
      return { data: false, source: targetLayer, success: false, error: String(err) };
    }
  }

  /**
   * Partially update specific fields of a record without a full read-modify-write cycle.
   */
  async patch<T extends { id?: string }>(
    collection: string,
    id: string,
    fields: Partial<T>,
    host?: string
  ): Promise<QueryResult<T>> {
    const key = this.writeLayer(host);
    const db = this.連線池.get(key);
    if (!db) return { data: null, source: 'L3', success: false, error: 'No writable database' };

    try {
      const updatedFields = { ...fields, updatedAt: new Date().toISOString() } as Record<string, unknown>;
      const result = await db.patch(collection, id, updatedFields);
      if (result) {
        return { data: result as T, source: this.keyToLayer(key), success: true };
      }
      return { data: null, source: this.keyToLayer(key), success: false, error: 'Record not found' };
    } catch (err) {
      return { data: null, source: this.keyToLayer(key), success: false, error: String(err) };
    }
  }

  /**
   * Count records in a collection, optionally filtered by model type.
   */
  async count(collection: string, modelType?: string, host?: string): Promise<number> {
    let total = 0;
    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        total += await db.count(collection, modelType);
      } catch { /* skip */ }
    }
    return total;
  }

  /**
   * Initialize a collection (table).
   */
  async initialize(collection: string): Promise<void> {
    const db = this.連線池.get('SYSTEM');
    if (db) {
      await db.initialize(collection);
    }
  }

  // ═══════════════════════════════════════════
  //  System getter — direct L2 adapter access
  // ═══════════════════════════════════════════

  /**
   * Direct access to the L2 (SYSTEM) adapter for admin operations.
   * Returns `null` if L2 is not initialized.
   */
  get System(): DatabaseAdapter | null {
    return this.連線池.get('SYSTEM') ?? null;
  }

  // ═══════════════════════════════════════════
  //  Internal: Layer routing
  // ═══════════════════════════════════════════

  private async getLayerKeys(host?: string): Promise<string[]> {
    if (host && !this.連線池.has(host)) {
      await this.initL3(host);
    }

    const keys: string[] = [];

    if (host && this.連線池.has(host)) keys.push(host);

    for (const k of this.連線池.keys()) {
      if (k !== 'SYSTEM' && k !== host) keys.push(k);
    }

    if (this.連線池.has('SYSTEM')) keys.push('SYSTEM');

    // Note: L1 is no longer a fallback — it's a config store only.
    // Query degradation stops at L2.

    return keys;
  }

  private writeLayer(host?: string): string {
    if (host && this.連線池.has(host)) return host;
    if (this.連線池.has('SYSTEM')) return 'SYSTEM';
    throw new Error('No writable database layer available (L2 not initialized)');
  }

  private keyToLayer(key: string): SourceLevel {
    if (key === 'SYSTEM') return 'L2';
    return 'L3';
  }

  // ═══════════════════════════════════════════
  //  Internal: Adapter factory
  // ═══════════════════════════════════════════

  private async buildAdapter(info: L2ConnectionInfo): Promise<DatabaseAdapter | null> {
    const type = info.type || 'surrealdb';

    switch (type) {
      case 'surrealdb': {
        const { SurrealAdapter } = await import('./adapter/surreal.ts');
        const adapter = new SurrealAdapter({
          url: `http://${info.host || 'localhost'}:${info.port ?? 8000}`,
          database: info.database || 'webcube',
          namespace: info.namespace || 'webcube',
          user: info.username || 'root',
          password: info.password || 'root',
        });
        if (await adapter.login()) return adapter;
        await error('Pool', 'SurrealDB login failed');
        return null;
      }
      case 'sqlite': {
        const { SqliteAdapter } = await import('./adapter/sqlite.ts');
        return new SqliteAdapter(info.filePath || info.database || './data/l2.db');
      }
      case 'mongodb': {
        const { MongoAdapter } = await import('./adapter/mongodb.ts');
        const uri = `mongodb://${info.username || ''}:${info.password || ''}@${info.host || 'localhost'}:${info.port ?? 27017}`;
        return new MongoAdapter(uri, info.database || 'webcube');
      }
      case 'firestore':
      case 'firebase': {
        const { FirestoreAdapter } = await import('./adapter/firestore.ts');
        const adapter = new FirestoreAdapter({
          projectId: info.host || info.database || 'webcube',
          credential: info.password ? (() => { try { return JSON.parse(info.password); } catch { return undefined; } })() : undefined,
          databaseId: info.namespace,
        });
        await adapter.connect();
        return adapter;
      }
      case 'dynamodb': {
        const { DynamoDBAdapter } = await import('./adapter/dynamodb.ts');
        const adapter = new DynamoDBAdapter({
          region: info.host || 'ap-northeast-1',
          accessKeyId: info.username || undefined,
          secretAccessKey: info.password || undefined,
        });
        adapter.connect();
        return adapter;
      }
      case 'mssql':
      case 'sqlserver': {
        const { MssqlAdapter } = await import('./adapter/mssql.ts');
        const adapter = new MssqlAdapter({
          server: info.host || 'localhost',
          port: info.port ?? 1433,
          user: info.username || 'sa',
          password: info.password || '',
          database: info.database || 'webcube',
          schema: info.namespace || 'dbo',
          encrypt: false,
        });
        await adapter.connect();
        return adapter;
      }
      case 'appwrite': {
        const { AppwriteAdapter } = await import('./adapter/appwrite.ts');
        const adapter = new AppwriteAdapter({
          endpoint: info.host || 'https://cloud.appwrite.io/v1',
          project: info.database || 'webcube',
          apiKey: info.password || '',
          databaseId: info.namespace || 'default',
        });
        await adapter.connect();
        return adapter;
      }
      case 'postgresql':
      case 'postgres': {
        const { PgsqlAdapter } = await import('./adapter/pgsql.ts');
        const adapter = new PgsqlAdapter({
          host: info.host || 'localhost',
          port: info.port ?? 5432,
          user: info.username || 'postgres',
          password: info.password || '',
          database: info.database || 'webcube',
        });
        await adapter.connect({
          host: info.host || 'localhost',
          port: info.port ?? 5432,
          user: info.username || 'postgres',
          password: info.password || '',
          database: info.database || 'webcube',
        });
        return adapter;
      }
      case 'mysql':
      case 'mariadb': {
        const { MysqlAdapter } = await import('./adapter/mysql.ts');
        const adapter = new MysqlAdapter({
          host: info.host || 'localhost',
          port: info.port ?? 3306,
          user: info.username || 'root',
          password: info.password || '',
          database: info.database || 'webcube',
        });
        await adapter.connect({
          host: info.host || 'localhost',
          port: info.port ?? 3306,
          user: info.username || 'root',
          password: info.password || '',
          database: info.database || 'webcube',
        });
        return adapter;
      }
      default:
        await error('Pool', `Unsupported database type: ${type}`);
        return null;
    }
  }

  // ═══════════════════════════════════════════
  //  Internal: Helpers
  // ═══════════════════════════════════════════

  private async resolveId<T extends { id?: string }>(
    collection: string, data: Partial<T>
  ): Promise<{ id: string; isUpdate: boolean }> {
    if (!data.id) {
      const { nanoid } = await import('nanoid');
      return { id: `${collection}:${collection}:${nanoid(12)}`, isUpdate: false };
    }

    const idStr = data.id as string;
    // Already a composite ID (3 parts or contains colon) → use as-is
    if (idStr.split(':').length >= 2) {
      return { id: idStr, isUpdate: true };
    }

    // Raw nanoid without prefix — compose it with collection as both domain and type
    const { nanoid } = await import('nanoid');
    return { id: `${collection}:${collection}:${nanoid(12)}`, isUpdate: false };
  }

  // ═══════════════════════════════════════════
  //  Cleanup
  // ═══════════════════════════════════════════

  /**
   * Close all database connections and clear the connection pool.
   */
  close(): void {
    this.連線池.clear();
  }
}

// ── Global Singleton ──

/**
 * Global singleton data pool instance.
 * Initialize layers with initL1(), initL2(), initL3(host).
 */
export const dataPool: PoolCore = new PoolCore();
