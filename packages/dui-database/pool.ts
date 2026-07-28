// Data Pool — L2/L3 multi-layer data access
// Global singleton, import directly by all services
//
// Architecture:
//   L1 (config KV) → stores L2 connection info (provided by caller via setConfigStore)
//   L2 (SYSTEM)    → central database (read L2 connection info from L1 store)
//   L3 (HOST)      → per-site database via hostname lookup (from L2 site data)
//
// Query routing: L3 (specific host) → other L3 → L2 (SYSTEM)
// No L1 fallback — L1 is a config store, not a database.
//
// Lifecycle (managed by caller, e.g. @dui/framework createGateway()):
//   const l1 = new L1Store(...);
//   await l1.init();
//   dataPool.setConfigStore(l1);     // provide L1 reference
//   await dataPool.initL2();         // read L2 conn info from L1 → connect

import type { DatabaseAdapter, QueryOptions } from './adapter/adapter-interface.ts';
import type { L2ConnectionInfo } from './index.ts';
import { BasePool } from '@dui/pool';
import type { PoolItem, PoolItemOverview } from '@dui/pool';
import { L1Store } from '@dui/kv';
import { info, error } from '@dui/util';

// ── Collection 記憶體工具函式（避免 list() / listAll() 重複邏輯） ──

/** 記憶體層級欄位過濾（支援深層路徑 a.b.c） */
function applyMemoryFilter<T extends Record<string, unknown>>(items: T[], filter?: Record<string, string>): T[] {
  if (!filter) return items;
  return items.filter((r) =>
    Object.entries(filter).every(([field, value]) => {
      let cur: unknown = r;
      for (const part of field.split('.')) {
        if (cur === null || cur === undefined) return false;
        cur = (cur as Record<string, unknown>)[part];
      }
      return String(cur) === value;
    }),
  );
}

/** 記憶體層級排序（支援深層路徑 a.b.c） */
function applyMemorySort<T extends Record<string, unknown>>(items: T[], sort?: string, order: 'asc' | 'desc' = 'desc'): T[] {
  if (!sort) return items;
  const dir = order === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    let va: unknown = a, vb: unknown = b;
    for (const part of sort.split('.')) {
      va = (va as Record<string, unknown>)?.[part];
      vb = (vb as Record<string, unknown>)?.[part];
    }
    return (String(va) > String(vb) ? 1 : -1) * dir;
  });
}

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
  /** 記憶體過濾後的總筆數（僅在 list() 有 filter 時提供） */
  totalCount?: number;
}

// ── Adapter Registry (取代 switch-case factory) ──

type AdapterFactory = (info: L2ConnectionInfo) => Promise<DatabaseAdapter | null>;

const adapterFactories = new Map<string, AdapterFactory>();

/**
 * Register a database adapter factory.
 * New adapters can be added without modifying pool.ts.
 */
function registerAdapter(type: string, factory: AdapterFactory): void {
  adapterFactories.set(type.toLowerCase(), factory);
}

/** Build an adapter instance by type + connection info via the registry. */
async function createAdapter(type: string, info: L2ConnectionInfo): Promise<DatabaseAdapter | null> {
  const factory = adapterFactories.get(type.toLowerCase());
  if (!factory) return null;
  return await factory(info);
}

// ── Register all built-in adapters ──

registerAdapter('surrealdb', async (info) => {
  const { SurrealAdapter } = await import('./adapter/surreal.ts');
  const adapter = new SurrealAdapter({
    url: info.host || 'http://localhost:8000',
    namespace: info.namespace || 'webcube',
    database: info.database || 'webcube',
    user: info.username || '',
    password: info.password || '',
  });
  await adapter.login();
  return adapter;
});

registerAdapter('sqlite', async (info) => {
  const { SqliteAdapter } = await import('./adapter/sqlite.ts');
  return new SqliteAdapter(info.filePath || './data/db.sqlite');
});

registerAdapter('mongodb', async (info) => {
  const { MongoAdapter } = await import('./adapter/mongodb.ts');
  const connStr = `mongodb://${info.username ? `${info.username}:${info.password}@` : ''}${info.host || 'localhost'}:${info.port || 27017}/${info.database || 'webcube'}`;
  return new MongoAdapter(connStr, info.database || 'webcube');
});

registerAdapter('mysql', async (info) => {
  const { MysqlAdapter } = await import('./adapter/mysql.ts');
  const adapter = new MysqlAdapter({
    host: info.host,
    port: info.port,
    user: info.username,
    password: info.password,
    database: info.database || 'webcube',
  });
  await adapter.connect();
  return adapter;
});

registerAdapter('postgresql', async (info) => {
  const { PgsqlAdapter } = await import('./adapter/pgsql.ts');
  const adapter = new PgsqlAdapter({
    host: info.host,
    port: info.port,
    user: info.username,
    password: info.password,
    database: info.database,
  });
  await adapter.connect();
  return adapter;
});

registerAdapter('firestore', async (info) => {
  const { FirestoreAdapter } = await import('./adapter/firestore.ts');
  const adapter = new FirestoreAdapter({
    projectId: info.host || info.database || '',
    credential: info.credential,
    databaseId: info.namespace,
  });
  await adapter.connect();
  return adapter;
});

registerAdapter('appwrite', async (info) => {
  const { AppwriteAdapter } = await import('./adapter/appwrite.ts');
  const adapter = new AppwriteAdapter({
    endpoint: info.host || 'https://cloud.appwrite.io/v1',
    project: info.database || '',
    apiKey: info.password || '',
    databaseId: info.namespace,
  });
  await adapter.connect();
  return adapter;
});

registerAdapter('dynamodb', async (info) => {
  const { DynamoDBAdapter } = await import('./adapter/dynamodb.ts');
  const adapter = new DynamoDBAdapter({
    region: info.host || 'ap-northeast-1',
    accessKeyId: info.username,
    secretAccessKey: info.password,
  });
  adapter.connect();
  return adapter;
});

registerAdapter('mssql', async (info) => {
  const { MssqlAdapter } = await import('./adapter/mssql.ts');
  const adapter = new MssqlAdapter({
    server: info.host || 'localhost',
    port: info.port || 1433,
    user: info.username || 'sa',
    password: info.password || '',
    database: info.database || 'webcube',
    schema: info.namespace,
  });
  await adapter.connect();
  return adapter;
});

// ── Pool Status Extension (v0.3.0) ──

/** PoolCore 擴充的項目元資料（繼承 PoolItemOverview + db specific fields） */
export interface DbPoolItemOverview extends PoolItemOverview {
  /** 資料庫類型（L2="SYSTEM" / L3=hostname） */
  dbName: string;
  /** 是否為 SYSTEM 層 */
  isSystem: boolean;
}

// ── Pool Core ──

/**
 * Multi-layer data pool with L2/L3 routing.
 *
 * - L1 (CONFIG): KV store (JSON file) for system settings + L2 connection info
 *   (provided by caller via setConfigStore — pool does NOT manage L1 lifecycle)
 * - L2 (SYSTEM): Central database (MySQL, PostgreSQL, MongoDB, etc.)
 * - L3 (HOST): Per-site database via hostname lookup
 *
 * Query degradation: L3 → other L3 → L2. No L1 fallback.
 *
 * Inherits BasePool for automatic idle connection eviction:
 *   - L3 connections idle for 30+ minutes are closed via onEvict()
 */
export class PoolCore extends BasePool<string, DatabaseAdapter> {
  private _l1: L1Store | null = null;
  /** Promise-based single-flight lock for L2 init (取代 busy waiting) */
  private l2InitPromise: Promise<void> | null = null;
  /** Promise-based single-flight locks for L3 init (keyed by host) */
  private l3InitPromises = new Map<string, Promise<void>>();

  constructor() {
    super({
      cleanupIntervalMs: 10 * 60 * 1000,  // 每 10 分鐘掃描一次
      maxIdleMs: 30 * 60 * 1000,           // 超過 30 分鐘未存取視為冷資料
      heartbeatIntervalMs: 5 * 60 * 1000,  // 每 5 分鐘對常駐連線發送 ping
    });
  }

  // ═══════════════════════════════════════════
  //  L1 Store — provided by caller
  // ═══════════════════════════════════════════

  /**
   * Provide a reference to the L1 config store.
   * Must be called before `initL2()`.
   *
   * L1 lifecycle (init, crypto key) is managed by the caller
   * (e.g. `@dui/framework/createGateway()`), not by the pool.
   */
  setConfigStore(l1: L1Store): void {
    this._l1 = l1;
  }

  /**
   * Access the L1 config store.
   * Returns `null` if `setConfigStore()` has not been called yet.
   */
  get config(): L1Store | null {
    return this._l1;
  }

  // ═══════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════

  /**
   * Initialize L2 (SYSTEM) with Promise single-flight.
   *
   * Multiple concurrent calls share one init — no busy waiting.
   * Requires `setConfigStore()` to have been called first with an initialized L1.
   */
  async initL2(): Promise<void> {
    if (this.has('SYSTEM')) return;
    if (!this.l2InitPromise) {
      this.l2InitPromise = this.doInitL2().finally(() => { this.l2InitPromise = null; });
    }
    return this.l2InitPromise;
  }

  /** Actual L2 init work, wrapped by initL2() single-flight. */
  private async doInitL2(): Promise<void> {
    if (this.has('SYSTEM')) return;
    if (!this._l1) {
      await error('Pool', 'setConfigStore() not called — cannot init L2');
      return;
    }
    const connStr = await this._l1.get('l2_connection');
    if (!connStr) return;

    const { decrypt } = await import('@dui/util');
    const decrypted = await decrypt(connStr);
    const l2Info: L2ConnectionInfo = JSON.parse(decrypted);

    const l2 = await createAdapter(l2Info.type, l2Info);
    if (!l2) return;

    this.set('SYSTEM', l2, false, true);
    await info('Pool', 'L2 connected');
  }

  /**
   * Initialize L3 (per-host database) with Promise single-flight.
   *
   * Multiple concurrent calls for the same host share one init.
   * Called automatically on first query for a given host.
   */
  async initL3(host: string): Promise<void> {
    if (this.has(host)) return;
    if (!this.l3InitPromises.has(host)) {
      const p = this.doInitL3(host).finally(() => { this.l3InitPromises.delete(host); });
      this.l3InitPromises.set(host, p);
    }
    return this.l3InitPromises.get(host)!;
  }

  /** Actual L3 init work, wrapped by initL3() single-flight. */
  private async doInitL3(host: string): Promise<void> {
    if (this.has(host)) return;
    const site = await this.getSiteConfig(host);
    if (!site?.l3Connection) return;

    const l3 = await createAdapter(site.l3Connection.type, site.l3Connection);
    if (!l3) return;

    this.set(host, l3, false);
    await info('Pool', `L3 connected for ${host}`);
  }

  // ═══════════════════════════════════════════
  //  Direct Access (used by data-gateway)
  // ═══════════════════════════════════════════

  /** Direct access to L2 SYSTEM adapter. */
  get System(): DatabaseAdapter | null {
    return this.get('SYSTEM');
  }

  // ═══════════════════════════════════════════
  //  Public Query API
  // ═══════════════════════════════════════════

  /**
   * List records from **all available layers** (L2 + L3) merged.
   *
   * - Queries L2 (SYSTEM) unconditionally.
   * - If `host` is provided, also queries that L3 tenant database.
   * - Merges by `id` (L3 records take precedence over same-id L2 records).
   * - Supports in-memory filter/sort after merging.
   * - Applies pagination (`limit`/`offset`) on the merged result set.
   *
   * Use `list()` instead if you only want a single layer (L3→L2 fallback).
   */
  async listAll(
    collection: string,
    modelType?: string,
    options?: QueryOptions,
    host?: string,
  ): Promise<{ data: Record<string, unknown>[]; source: string; success: boolean; totalCount: number }> {
    // ── 1. Fetch L2 (all, no limit) ──
    await this.initL2();
    const l2 = this.get('SYSTEM');
    let l2Data: Record<string, unknown>[] = [];
    if (l2) {
      const noLimitOpts = options ? { ...options, limit: undefined, offset: undefined } : undefined;
      l2Data = (await l2.list(collection, modelType, noLimitOpts)) ?? [];
    }

    // ── 2. Fetch L3 if host provided (all, no limit) ──
    let l3Data: Record<string, unknown>[] = [];
    if (host) {
      await this.initL3(host);
      const l3 = this.get(host);
      if (l3) {
        const noLimitOpts = options ? { ...options, limit: undefined, offset: undefined } : undefined;
        l3Data = (await l3.list(collection, modelType, noLimitOpts)) ?? [];
      }
    }

    // ── 3. Merge (L3 overrides L2 for same id) ──
    const merged = new Map<string, Record<string, unknown>>();
    for (const item of l3Data) {
      const id = (item as any).id;
      if (id) merged.set(String(id), item); // 跳過無 ID 記錄
    }
    for (const item of l2Data) {
      const id = (item as any).id;
      if (id && !merged.has(String(id))) merged.set(String(id), item);
    }

    let results = Array.from(merged.values());

    // ── 4. In-memory filter ──
    results = applyMemoryFilter(results, options?.filter);

    // ── 5. In-memory sort ──
    results = applyMemorySort(results, options?.sort, options?.order);

    // ── 6. Pagination ──
    const limit = Math.min(100, options?.limit ?? 50);
    const offset = options?.offset ?? 0;
    const totalCount = results.length;
    const paged = results.slice(offset, offset + limit);

    return {
      data: paged,
      source: host ? 'L2+L3' : 'L2',
      success: true,
      totalCount,
    };
  }

  /**
   * Get a record by its composite ID.
   * Routes to L3 (host) → L2 (SYSTEM) automatically.
   */
  async getById(id: string, host?: string): Promise<QueryResult<Record<string, unknown>>> {
    // Try L3 first
    if (host) {
      await this.initL3(host);
      const l3 = this.get(host);
      if (l3) {
        const data = await l3.getById(id);
        if (data) return { data, source: 'L3', success: true };
      }
    }

    // Fallback to L2
    await this.initL2();
    const l2 = this.get('SYSTEM');
    if (l2) {
      const data = await l2.getById(id);
      if (data) return { data, source: 'L2', success: true };
    }

    return { data: null, source: 'L2', success: false };
  }

  /**
   * List records from a collection.
   */
  async list(
    collection: string,
    modelType?: string,
    options?: QueryOptions,
    host?: string,
  ): Promise<QueryResult<Record<string, unknown>[]>> {
    const getData = async () => {
      if (host) {
        await this.initL3(host);
        const l3 = this.get(host);
        if (l3) return await l3.list(collection, modelType, options);
      }
      await this.initL2();
      const l2 = this.get('SYSTEM');
      if (l2) return await l2.list(collection, modelType, options);
      return null;
    };

    // ── 有 filter/sort 時，撈全部資料再做記憶體過濾 ──
    const needsPost = options?.filter || options?.sort;
    if (needsPost) {
      // 先不帶 limit/offset 撈全部
      const raw = await getData();
      if (!raw) return { data: [], source: 'L2', success: false };
      const source = host ? 'L3' : 'L2';

      // 記憶體過濾（使用共用 applyMemoryFilter / applyMemorySort）
      let filtered = applyMemoryFilter(raw, options?.filter);
      filtered = applyMemorySort(filtered, options?.sort, options?.order);

      // 分頁（對過濾後的結果）
      const limit = Math.min(100, options?.limit ?? 50);
      const offset = options?.offset ?? 0;
      const paged = filtered.slice(offset, offset + limit);

      return { data: paged, source, success: true, totalCount: filtered.length };
    }

    // ── 無 filter，直接走 adapter ──
    const data = await getData();
    return data
      ? { data, source: host ? 'L3' : 'L2', success: true }
      : { data: [], source: 'L2', success: false };
  }

  /**
   * Create a record.
   */
  async create(
    collection: string,
    id: string,
    data: Record<string, unknown>,
    host?: string,
  ): Promise<QueryResult<Record<string, unknown>>> {
    if (host) {
      await this.initL3(host);
      const l3 = this.get(host);
      if (l3) {
        const result = await l3.create(collection, id, data);
        return { data: result, source: 'L3', success: true };
      }
    }

    await this.initL2();
    const l2 = this.get('SYSTEM');
    if (l2) {
      const result = await l2.create(collection, id, data);
      return { data: result, source: 'L2', success: true };
    }

    return { data: null, source: 'L2', success: false };
  }

  /**
   * Update (upsert) a record.
   */
  async update(
    collection: string,
    id: string,
    data: Record<string, unknown>,
    host?: string,
  ): Promise<QueryResult<Record<string, unknown>>> {
    if (host) {
      await this.initL3(host);
      const l3 = this.get(host);
      if (l3) {
        const result = await l3.update(collection, id, data);
        return { data: result, source: 'L3', success: true };
      }
    }

    await this.initL2();
    const l2 = this.get('SYSTEM');
    if (l2) {
      const result = await l2.update(collection, id, data);
      return { data: result, source: 'L2', success: true };
    }

    return { data: null, source: 'L2', success: false };
  }

  /**
   * Partially update specific fields of a record.
   */
  async patch(
    collection: string,
    id: string,
    fields: Record<string, unknown>,
    host?: string,
  ): Promise<QueryResult<Record<string, unknown>>> {
    if (host) {
      await this.initL3(host);
      const l3 = this.get(host);
      if (l3) {
        const result = await l3.patch(collection, id, fields);
        return { data: result, source: 'L3', success: !!result };
      }
    }

    await this.initL2();
    const l2 = this.get('SYSTEM');
    if (l2) {
      const result = await l2.patch(collection, id, fields);
      return { data: result, source: 'L2', success: !!result };
    }

    return { data: null, source: 'L2', success: false };
  }

  /**
   * Delete a record by composite ID.
   */
  async deleteRecord(id: string, host?: string): Promise<QueryResult<boolean>> {
    if (host) {
      await this.initL3(host);
      const l3 = this.get(host);
      if (l3) {
        const result = await l3.delete(id);
        return { data: result, source: 'L3', success: true };
      }
    }

    await this.initL2();
    const l2 = this.get('SYSTEM');
    if (l2) {
      const result = await l2.delete(id);
      return { data: result, source: 'L2', success: true };
    }

    return { data: false, source: 'L2', success: false };
  }

  /**
   * Get a site config by hostname (stored in L2 SYSTEM database).
   */
  private async getSiteConfig(host: string): Promise<{ l3Connection?: L2ConnectionInfo } | null> {
    await this.initL2();
    const l2 = this.get('SYSTEM');
    if (!l2) return null;

    // 新格式：網站資訊:網站資訊:{host}（由 POST /api/site/apply 寫入）
    try {
      const data = await l2.getById(`網站資訊:網站資訊:${host}`);
      if (data) {
        const site = data as Record<string, unknown>;
        if (site.資料庫) {
          const { decrypt } = await import('@dui/util');
          const decrypted = await decrypt(site.資料庫 as string);
          return { l3Connection: JSON.parse(decrypted) as L2ConnectionInfo };
        }
        return { l3Connection: undefined };
      }
    } catch {
      // 不存在或查詢失敗，繼續嘗試舊格式
    }

    // 舊格式相容：site:config:{host}
    try {
      const data = await l2.getById(`site:config:${host}`);
      return data as { l3Connection?: L2ConnectionInfo } | null;
    } catch {
      return null;
    }
  }

  /**
   * Test whether a database connection is reachable.
   * Builds a temporary adapter, connects, then discards it.
   *
   * @returns `{ ok: true }` on success, or `{ ok: false, message }` on failure.
   */
  async testConnection(info: L2ConnectionInfo): Promise<{ ok: boolean; message: string }> {
    try {
      const adapter = await createAdapter(info.type, info);
      if (!adapter) {
        return { ok: false, message: `不支援的資料庫類型：${info.type}` };
      }

      // SQLite adapter connects synchronously in constructor, no connect() needed
      if (typeof (adapter as any).connect === 'function') {
        await (adapter as any).connect();
      }

      return { ok: true, message: '連線成功' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: msg };
    }
  }

  // ═══════════════════════════════════════════
  //  BasePool Lifecycle Hooks
  // ═══════════════════════════════════════════

  /**\n    * DB connection pool has no data to write back.
   * (Database adapters handle persistence themselves.)
   */
  protected async onFlush(_dirtyItems: Map<string, DatabaseAdapter>): Promise<void> {
    // no-op
  }

  /**
   * Send a lightweight ping to persistent connections (L2 SYSTEM)
   * to prevent server-side idle disconnection.
   */
  protected override async onHeartbeat(): Promise<void> {
    const system = this.get('SYSTEM');
    if (!system) return;
    try {
      // Lightweight query to keep the connection alive
      await system.getById('_heartbeat_');
    } catch {
      await error('Pool', 'L2 heartbeat failed, attempting reconnect...');
      try {
        await this.initL2();
      } catch (err) {
        await error('Pool', `L2 reconnect failed: ${err}`);
      }
    }
  }

  /**
   * When idle L3 connections are evicted from the pool,
   * gracefully close them to release file descriptors and memory.
   */
  protected async onEvict(evictedItems: Map<string, DatabaseAdapter>): Promise<void> {
    for (const [host, adapter] of evictedItems) {
      await error('Pool', `Closing idle L3 connection: ${host}`);
      // Some adapters have a close/disconnect method not in the interface
      const closeable = adapter as { close?: () => Promise<void> };
      if (closeable.close) {
        try {
          await closeable.close();
        } catch {
          // ignore close errors
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  //  Pool Observability (v0.3.0 override)
  // ═══════════════════════════════════════════

  /**
   * Returns metadata for all pooled items, enriched with database-specific fields.
   *
   * Each item includes the base `PoolItemOverview` fields plus:
   * - `dbName`: host key (L3) or "SYSTEM" (L2)
   * - `isSystem`: true for the SYSTEM/L2 pool entry
   */
  override getItemsOverview(): DbPoolItemOverview[] {
    const base = super.getItemsOverview();
    return base.map((item) => ({
      ...item,
      dbName: item.key,
      isSystem: item.key === 'SYSTEM',
    }));
  }

  // ═══════════════════════════════════════════
  //  Graceful Shutdown
  // ═══════════════════════════════════════════

  /**
   * Gracefully shut down all pooled database connections.
   *
   * Iterates through every adapter in the pool and calls `close()`
   * if the adapter exposes one. Clears the pool afterwards.
   *
   * Designed to be called from process signal handlers
   * (SIGINT / SIGTERM) to prevent zombie connections.
   */
  static async shutdownAll(): Promise<void> {
    const pool = dataPool;
    const keys = pool.keys();
    for (const key of keys) {
      const adapter = pool.get(key);
      if (!adapter) continue;
      const closeable = adapter as { close?: () => Promise<void> };
      if (closeable.close) {
        try {
          await closeable.close();
        } catch {
          // ignore close errors during shutdown
        }
      }
    }
    pool.destroy();
  }
}

/** Global singleton data pool instance. */
export const dataPool = new PoolCore();

// ── Process Signal Handlers ──
// Gracefully close all database connections on shutdown
// to prevent zombie connections and exhausted DB server limits.

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  Deno.addSignalListener(signal, () => {
    PoolCore.shutdownAll().finally(() => Deno.exit(0));
  });
}