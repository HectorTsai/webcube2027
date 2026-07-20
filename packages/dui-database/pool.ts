// Data Pool — L1/L2/L3 multi-layer data access
// Global singleton, import directly by all services
//
// Routing: L3 (specific host) → other L3 → L2 (SYSTEM) → L1 (BASE) degraded fallback
// System getter: get L2 DatabaseAdapter directly for admin operations
//
// Lifecycle:
//   await dataPool.initL1()
//     → connect + auto-seed for all registered models
//   await dataPool.initL2()
//   await dataPool.initL3(host)

import type { DatabaseAdapter } from './adapter/adapter-interface.ts';
import type { L2ConnectionInfo } from './index.ts';
import { info, error } from './logger.ts';
import { listModels, toModelInstance } from './model-registry.ts';

// ── Query Result ──

type SourceLevel = 'L1' | 'L2' | 'L3';

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
 * Multi-layer data pool with L1/L2/L3 routing.
 *
 * - L1 (BASE): SQLite, local file database
 * - L2 (SYSTEM): Central database (MySQL, PostgreSQL, MongoDB, etc.)
 * - L3 (Host): Per-site database via hostname lookup
 *
 * Query degradation: L3 → other L3 → L2 → L1, higher layer wins.
 */
export class PoolCore {
  /**
   * Partially update specific fields of a record without a full read-modify-write cycle.
   *
   * This is the efficient choice for high-frequency field updates (e.g. updating
   * a `lastRead` timestamp on a cache record), as it only pushes the changed
   * fields to the database.
   *
   * The `updatedAt` field is automatically updated.
   */
  async patch<T extends { id?: string }>(
    model: string,
    id: string,
    fields: Partial<T>,
    host?: string
  ): Promise<QueryResult<T>> {
    const key = this.writeLayer(host);
    const db = this.連線池.get(key);
    if (!db) return { data: null, source: 'L1', success: false, error: 'No writable database' };

    try {
      const updatedFields = { ...fields, updatedAt: new Date().toISOString() } as Record<string, unknown>;
      const result = await db.patch(model, id, updatedFields);
      if (result) {
        const instance = this.toModelInstance<T>(model, result);
        if (instance) return { data: instance, source: this.keyToLayer(key), success: true };
      }
      return { data: null, source: this.keyToLayer(key), success: false, error: 'Record not found' };
    } catch (err) {
      return { data: null, source: this.keyToLayer(key), success: false, error: String(err) };
    }
  }

  /** L1="BASE", L2="SYSTEM", L3=host */
  private 連線池 = new Map<string, DatabaseAdapter>();
  private 初始化中 = { L2: false, L3: new Set<string>() };

  // ═══════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════

  /** Initialize L1 (SQLite). Connects to the database and auto-seeds all registered models. */
  async initL1(): Promise<void> {
    if (this.連線池.has('BASE')) return;
    const 路徑 = Deno.env.get('L1_DB_PATH') || './data/webcube.db';

    const { SqliteAdapter } = await import('./adapter/sqlite.ts');
    const l1 = new SqliteAdapter(路徑);
    await info('Pool', `L1 connected — SQLite (${路徑})`);

    this.連線池.set('BASE', l1);

    // L1 seed: init all registered models
    const models = listModels();
    for (const m of models) {
      try { await l1.initialize(m); } catch (e) { await error('Pool', `L1 seed failed: ${m} — ${e}`); }
    }
    await info('Pool', `L1 seed complete (${models.length} models)`);
  }

  /** Initialize L2 (SYSTEM). Reads connection info from L1 and connects to the central database. */
  async initL2(): Promise<void> {
    if (this.連線池.has('SYSTEM')) return;

    if (this.初始化中.L2) {
      while (this.初始化中.L2) await new Promise(r => setTimeout(r, 100));
      return;
    }

    this.初始化中.L2 = true;
    try {
      const l1 = this.連線池.get('BASE')!;
      const l2Info = await this.readL2ConnectionInfo(l1);
      if (!l2Info) { this.初始化中.L2 = false; return; }

      const l2 = await this.buildAdapter(l2Info);
      if (!l2) { this.初始化中.L2 = false; return; }

      this.連線池.set('SYSTEM', l2);
      await info('Pool', 'L2 connected');
    } finally {
      this.初始化中.L2 = false;
    }
  }

  /**
   * Initialize L3 for a specific host. Reads connection info from L2's site data.
   * @param host - The hostname/domain to initialize L3 for.
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
  //  Public Query API (L3 → L2 → L1 degraded)
  // ═══════════════════════════════════════════

  /**
   * Get a single record by its composite ID.
   * Searches through L3 → L2 → L1 and returns the first match.
   */
  async getById<T extends { id: string }>(id: string, host?: string): Promise<QueryResult<T>> {
    const model = this.parseModel(id);
    if (!model) return { data: null, source: 'L1', success: false, error: 'Invalid ID format' };

    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        const raw = await db.getById(model, id);
        if (raw) {
          const 實例 = this.toModelInstance<T>(model, raw);
          if (實例) return { data: 實例, source: this.keyToLayer(key), success: true };
        }
      } catch { /* degrade to next layer */ }
    }

    return { data: null, source: 'L1', success: false, error: 'Not found in any available layer' };
  }

  /**
   * List records from the highest available layer (L3 → L2 → L1).
   * Returns the first layer that has data.
   */
  async list<T extends { id: string }>(
    model: string,
    limit: number = 50,
    offset: number = 0,
    host?: string
  ): Promise<QueryResult<T[]>> {
    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        const rows = await db.list(model, { limit, offset });
        if (rows.length > 0) {
          const allData: T[] = [];
          for (const row of rows) {
            const instance = this.toModelInstance<T>(model, row);
            if (instance) allData.push(instance);
          }
          return { data: allData, source: this.keyToLayer(key), success: true };
        }
      } catch { /* degrade */ }
    }

    return { data: [], source: 'L1', success: true };
  }

  /**
   * Merge all layers (deduplicated, higher layer wins).
   * Unlike list(), this returns data from ALL available layers.
   */
  async listAll<T extends { id: string }>(
    model: string,
    limit: number = 50,
    offset: number = 0,
    host?: string
  ): Promise<QueryResult<T[]>> {
    const allData: T[] = [];
    const seen = new Set<string>();

    for (const key of await this.getLayerKeys(host)) {
      const db = this.連線池.get(key)!;
      try {
        const rows = await db.list(model, { limit, offset });
        for (const row of rows) {
          const rid = row.id as string;
          if (seen.has(rid)) continue;
          seen.add(rid);
          const instance = this.toModelInstance<T>(model, row);
          if (instance) allData.push(instance);
        }
      } catch { /* skip failed layer */ }
    }

    return { data: allData, source: 'L1', success: true };
  }

  /**
   * Get the default value for a model — always from L1 seed data.
   */
  async getDefault<T extends { id: string }>(model: string): Promise<QueryResult<T>> {
    const db = this.連線池.get('BASE');
    if (!db) return { data: null, source: 'L1', success: false, error: 'L1 not initialized' };

    const rows = await db.list(model, { limit: 1 });
    if (rows.length > 0) {
      const instance = this.toModelInstance<T>(model, rows[0]);
      if (instance) return { data: instance, source: 'L1', success: true };
    }
    return { data: null, source: 'L1', success: false, error: 'No default data' };
  }

  /**
   * Upsert (create or update) a record in the target layer.
   * If the record exists it is updated; otherwise a new record is created.
   */
  async upsert<T extends { id?: string }>(
    model: string,
    data: Partial<T>,
    host?: string
  ): Promise<QueryResult<T>> {
    const key = this.writeLayer(host);
    const db = this.連線池.get(key);
    if (!db) return { data: null, source: 'L1', success: false, error: 'No writable database' };

    const { id, isUpdate } = await this.resolveId(model, data);
    const updateData = { ...data, id } as Record<string, unknown>;

    try {
      if (isUpdate) {
        const existing = await db.getById(model, id);
        if (!existing) {
          const created = await db.create(model, id, updateData);
          if (created) {
            const instance = this.toModelInstance<T>(model, created);
            if (instance) return { data: instance, source: this.keyToLayer(key), success: true };
          }
        }
      }

      const result = isUpdate
        ? await db.update(model, id, updateData)
        : await db.create(model, id, updateData);
      if (result) {
        const instance = this.toModelInstance<T>(model, result);
        if (instance) return { data: instance, source: this.keyToLayer(key), success: true };
      }

      return { data: null, source: this.keyToLayer(key), success: false, error: 'Write failed' };
    } catch (err) {
      return { data: null, source: this.keyToLayer(key), success: false, error: String(err) };
    }
  }

  /**
   * Delete a record by its composite ID.
   * System default records (marked as non-deletable) cannot be deleted.
   */
  async delete(id: string, host?: string): Promise<QueryResult<boolean>> {
    const model = this.parseModel(id);
    if (!model) return { data: false, source: 'L1', success: false, error: 'Invalid ID format' };

    // Check if deletable
    const existing = await this.getById(id, host);
    if (existing.success && (existing.data as Record<string, unknown>)?.deletable === false) {
      return { data: false, source: existing.source, success: false, error: 'This record is not deletable (system default data)' };
    }

    const key = this.writeLayer(host);
    const db = this.連線池.get(key);
    if (!db) return { data: false, source: 'L1', success: false, error: 'No writable database' };

    try {
      const ok = await db.delete(model, id) as boolean;
      return { data: ok, source: this.keyToLayer(key), success: ok };
    } catch (err) {
      return { data: false, source: this.keyToLayer(key), success: false, error: String(err) };
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
      if (k !== 'BASE' && k !== 'SYSTEM' && k !== host) keys.push(k);
    }

    if (this.連線池.has('SYSTEM')) keys.push('SYSTEM');

    keys.push('BASE');

    return keys;
  }

  private writeLayer(host?: string): string {
    if (host && this.連線池.has(host)) return host;
    if (this.連線池.has('SYSTEM')) return 'SYSTEM';
    return 'BASE';
  }

  private keyToLayer(key: string): SourceLevel {
    if (key === 'SYSTEM') return 'L2';
    if (key === 'BASE') return 'L1';
    return 'L3';
  }

  private parseModel(id: string): string | null {
    const parts = id.split(':');
    return parts.length >= 3 ? parts[1] : null;
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

  private async readL2ConnectionInfo(l1: DatabaseAdapter): Promise<L2ConnectionInfo | null> {
    const raw = await l1.getById('系統資訊', '系統資訊:系統資訊:預設');
    if (!raw) return null;

    const connStr = (typeof raw.資料庫 === 'string') ? raw.資料庫 as string : '';
    if (!connStr.trim()) return null;

    try { return JSON.parse(connStr) as L2ConnectionInfo; } catch { return null; }
  }

  // ═══════════════════════════════════════════
  //  Internal: Helpers
  // ═══════════════════════════════════════════

  private async resolveId<T extends { id?: string }>(
    model: string, data: Partial<T>
  ): Promise<{ id: string; isUpdate: boolean }> {
    if (!data.id) {
      const { nanoid } = await import('nanoid');
      return { id: `${model}:${model}:${nanoid(12)}`, isUpdate: false };
    }

    const idParts = (data.id as string).split(':');
    if (idParts.length === 3) {
      return { id: data.id as string, isUpdate: true };
    }

    const { nanoid } = await import('nanoid');
    const table = idParts[0];
    const m = idParts.length === 2 ? idParts[1] : table;
    return { id: `${table}:${m}:${nanoid(12)}`, isUpdate: false };
  }

  private toModelInstance<T>(
    model: string,
    rawData: Record<string, unknown>
  ): T | null {
    return toModelInstance(model, rawData) as T | null;
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
