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
import { L1Store } from '@dui/kv';
import { info, error } from '@dui/util';

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
  private 初始化中 = { L2: false, L3: new Set<string>() };
  private _l1: L1Store | null = null;

  constructor() {
    super({
      cleanupIntervalMs: 10 * 60 * 1000,  // 每 10 分鐘掃描一次
      maxIdleMs: 30 * 60 * 1000,           // 超過 30 分鐘未存取視為冷資料
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
   * Initialize L2 (SYSTEM). Reads connection info from L1 and connects.
   *
   * Requires `setConfigStore()` to have been called first with an initialized L1.
   */
  async initL2(): Promise<void> {
    if (this.has('SYSTEM')) return;

    if (!this._l1) {
      await error('Pool', 'setConfigStore() not called — cannot init L2');
      return;
    }

    if (this.初始化中.L2) {
      while (this.初始化中.L2) await new Promise(r => setTimeout(r, 100));
      return;
    }

    this.初始化中.L2 = true;
    try {
      const connStr = await this._l1.get('l2_connection');
      if (!connStr) { this.初始化中.L2 = false; return; }

      const { decrypt } = await import('@dui/util');
      const decrypted = await decrypt(connStr);
      const l2Info: L2ConnectionInfo = JSON.parse(decrypted);

      const l2 = await this.buildAdapter(l2Info);
      if (!l2) { this.初始化中.L2 = false; return; }

      // DB connection — no need for write-back, so markDirty = false
      this.set('SYSTEM', l2, false);
      await info('Pool', 'L2 connected');
    } catch (err) {
      await error('Pool', `L2 init failed: ${err}`);
    } finally {
      this.初始化中.L2 = false;
    }
  }

  /**
   * Initialize L3 (per-host database).
   * Called automatically on first query for a given host.
   */
  async initL3(host: string): Promise<void> {
    if (this.has(host)) return;
    if (this.初始化中.L3.has(host)) {
      while (this.初始化中.L3.has(host)) await new Promise(r => setTimeout(r, 100));
      return;
    }

    this.初始化中.L3.add(host);
    try {
      // Read L3 connection info from SYSTEM database (site record)
      const site = await this.getSiteConfig(host);
      if (!site?.l3Connection) { this.初始化中.L3.delete(host); return; }

      const l3 = await this.buildAdapter(site.l3Connection);
      if (!l3) { this.初始化中.L3.delete(host); return; }

      this.set(host, l3, false);
      await info('Pool', `L3 connected for ${host}`);
    } catch (err) {
      await error('Pool', `L3 init failed for ${host}: ${err}`);
    } finally {
      this.初始化中.L3.delete(host);
    }
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
    if (host) {
      await this.initL3(host);
      const l3 = this.get(host);
      if (l3) {
        const data = await l3.list(collection, modelType, options);
        return { data, source: 'L3', success: true };
      }
    }

    await this.initL2();
    const l2 = this.get('SYSTEM');
    if (l2) {
      const data = await l2.list(collection, modelType, options);
      return { data, source: 'L2', success: true };
    }

    return { data: [], source: 'L2', success: false };
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

    try {
      const data = await l2.getById(`site:config:${host}`);
      return data as { l3Connection?: L2ConnectionInfo } | null;
    } catch {
      return null;
    }
  }

  /**
   * Build a database adapter from connection info.
   */
  private async buildAdapter(info: L2ConnectionInfo): Promise<DatabaseAdapter | null> {
    if (!info.enabled) return null;

    try {
      switch (info.type) {
        case 'surrealdb': {
          const { SurrealAdapter } = await import('./adapter/surreal.ts');
          const adapter = new SurrealAdapter(
            info.host || 'http://localhost:8000',
            info.namespace || 'webcube',
            info.database || 'webcube',
            info.username,
            info.password,
          );
          await adapter.connect();
          return adapter;
        }
        case 'sqlite': {
          const { SqliteAdapter } = await import('./adapter/sqlite.ts');
          return new SqliteAdapter(info.filePath || './data/db.sqlite');
        }
        case 'mongodb': {
          const { MongoAdapter } = await import('./adapter/mongodb.ts');
          const connStr = `mongodb://${info.username ? `${info.username}:${info.password}@` : ''}${info.host || 'localhost'}:${info.port || 27017}/${info.database || 'webcube'}`;
          return new MongoAdapter(connStr, info.database || 'webcube');
        }
        case 'mysql': {
          const { MysqlAdapter } = await import('./adapter/mysql.ts');
          const adapter = new MysqlAdapter({
            host: info.host,
            port: info.port,
            user: info.username,
            password: info.password,
            database: info.database || 'webcube',
          });
          await adapter.connect({
            host: info.host,
            port: info.port,
            user: info.username,
            password: info.password,
            database: info.database || 'webcube',
          });
          return adapter;
        }
        case 'postgresql': {
          const { PgsqlAdapter } = await import('./adapter/pgsql.ts');
          const adapter = new PgsqlAdapter({
            host: info.host,
            port: info.port,
            user: info.username,
            password: info.password,
            database: info.database,
          });
          await adapter.connect({
            host: info.host,
            port: info.port,
            user: info.username,
            password: info.password,
            database: info.database,
          });
          return adapter;
        }
        case 'firestore': {
          const { FirestoreAdapter } = await import('./adapter/firestore.ts');
          const adapter = new FirestoreAdapter({
            projectId: info.host || info.database || '',
            credentials: info.password || '',
            databaseId: info.namespace,
          });
          await adapter.connect();
          return adapter;
        }
        case 'appwrite': {
          const { AppwriteAdapter } = await import('./adapter/appwrite.ts');
          const adapter = new AppwriteAdapter({
            endpoint: info.host || 'https://cloud.appwrite.io/v1',
            project: info.database || '',
            apiKey: info.password || '',
            databaseId: info.namespace,
          });
          await adapter.connect();
          return adapter;
        }
        case 'dynamodb': {
          const { DynamoDBAdapter } = await import('./adapter/dynamodb.ts');
          const adapter = new DynamoDBAdapter({
            region: info.host || 'ap-northeast-1',
            accessKeyId: info.username,
            secretAccessKey: info.password,
          });
          adapter.connect();
          return adapter;
        }
        case 'mssql': {
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
        }
        default:
          await error('Pool', `Unknown database type: ${info.type}`);
          return null;
      }
    } catch (err) {
      await error('Pool', `Failed to build adapter for ${info.type}: ${err}`);
      return null;
    }
  }

  // ═══════════════════════════════════════════
  //  BasePool Lifecycle Hooks
  // ═══════════════════════════════════════════

  /**
   * DB connection pool has no data to write back.
   * (Database adapters handle persistence themselves.)
   */
  protected async onFlush(_dirtyItems: Map<string, DatabaseAdapter>): Promise<void> {
    // no-op
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
}

/** Global singleton data pool instance. */
export const dataPool = new PoolCore();