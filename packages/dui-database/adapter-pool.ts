// Adapter Pool — pure database adapter registry + connection pool
//
// This is the core of @dui/database: a registry of adapter factories
// and a managed connection pool. No layer concepts (L1/L2/L3).
// Layer management lives in data-gateway services.
//
// Architecture:
//   - AdapterFactory registry (registerAdapter / createAdapter)
//   - Connection pool (extends BasePool for heartbeat/eviction/shutdown)
//   - testConnection() utility

import type { DatabaseAdapter } from './adapter/adapter-interface.ts';
import type { L2ConnectionInfo } from './index.ts';
import { BasePool } from '@dui/pool';
import type { PoolItemOverview } from '@dui/pool';
import { error } from '@dui/util';

// ── Adapter Registry (取代 switch-case factory) ──

type AdapterFactory = (info: L2ConnectionInfo) => Promise<DatabaseAdapter | null>;

const adapterFactories = new Map<string, AdapterFactory>();

/**
 * Register a database adapter factory.
 * New adapters can be added without modifying this file.
 */
export function registerAdapter(type: string, factory: AdapterFactory): void {
  adapterFactories.set(type.toLowerCase(), factory);
}

/** Build an adapter instance by type + connection info via the registry. */
export async function createAdapter(type: string, info: L2ConnectionInfo): Promise<DatabaseAdapter | null> {
  const factory = adapterFactories.get(type.toLowerCase());
  if (!factory) return null;
  return await factory(info);
}

/**
 * Gracefully close an adapter, tolerating both `close()` and `關閉()`
 * method names. No-op if the adapter has no close method.
 */
async function closeAdapter(adapter: DatabaseAdapter | null | undefined): Promise<void> {
  if (!adapter) return;
  const anyAdapter = adapter as unknown as {
    close?: () => Promise<void> | void;
    關閉?: () => Promise<void> | void;
  };
  try {
    if (typeof anyAdapter.close === 'function') await anyAdapter.close();
    else if (typeof anyAdapter.關閉 === 'function') await anyAdapter.關閉();
  } catch { /* ignore close errors */ }
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

// ── Adapter Pool Item Overview ──

/** AdapterPool 擴充的項目元資料 */
export interface AdapterPoolItemOverview extends PoolItemOverview {
  dbType: string;
  isPersistent: boolean;
}

// ── Adapter Pool ──

/**
 * Pure database adapter pool with lifecycle management.
 *
 * No layer concepts (L1/L2/L3). Each connection is identified by a string key
 * (e.g. "SYSTEM", "example.com", or any custom name). Persistent connections
 * (set with `isPersistent=true`) are immune to idle eviction and receive
 * periodic heartbeat pings.
 *
 * Layer management (which connections are SYSTEM vs tenant) is handled
 * by data-gateway services.
 */
export class AdapterPool extends BasePool<string, DatabaseAdapter> {
  constructor() {
    super({
      cleanupIntervalMs: 10 * 60 * 1000,  // 每 10 分鐘掃描一次
      maxIdleMs: 30 * 60 * 1000,           // 超過 30 分鐘未存取視為冷資料
      heartbeatIntervalMs: 5 * 60 * 1000,  // 每 5 分鐘對常駐連線發送 ping
    });
  }

  // ═══════════════════════════════════════════
  //  Utilities
  // ═══════════════════════════════════════════

  /**
   * Test whether a database connection is reachable.
   * Builds a temporary adapter, connects, then discards it.
   * The adapter is always closed (finally) to avoid connection leaks.
   */
  async testConnection(
    info: L2ConnectionInfo,
  ): Promise<{ ok: boolean; message: string }> {
    let adapter: DatabaseAdapter | null = null;
    try {
      adapter = await createAdapter(info.type, info);
      if (!adapter) {
        return { ok: false, message: `不支援的資料庫類型：${info.type}` };
      }

      // factory 建立時已完成連線（connect / login）；
      // 以輕量 ping 驗證可用性，不再重複呼叫 connect（避免非冪等連線造成洩漏）
      if (typeof adapter.ping === 'function') {
        const ok = await adapter.ping();
        if (!ok) {
          return { ok: false, message: '連線測試失敗（ping 無回應）' };
        }
      }

      return { ok: true, message: '連線成功' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: msg };
    } finally {
      await closeAdapter(adapter);
    }
  }

  // ═══════════════════════════════════════════
  //  BasePool Lifecycle Hooks
  // ═══════════════════════════════════════════

  /** No data to flush — database adapters handle persistence themselves. */
  protected async onFlush(_dirtyItems: Map<string, DatabaseAdapter>): Promise<void> {
    // no-op
  }

  /**
   * Send lightweight pings to all persistent connections
   * to prevent server-side idle disconnection.
   *
   * Runs pings in parallel (Promise.allSettled) so a slow adapter
   * doesn't block heartbeats for the rest of the pool.
   */
  protected override async onHeartbeat(): Promise<void> {
    const pings = Array.from(this.items.entries())
      .filter(([, entry]) => entry.persistent)
      .map(async ([key, entry]) => {
        try {
          // 優先使用 adapter 的輕量 ping（SELECT 1 / 原生 ping）；
          // 避免對不存在的 _heartbeat_ 表執行 count() 造成資料庫 Log 汙染
          const adapter = entry.value;
          if (typeof adapter.ping === 'function') {
            await adapter.ping();
          } else {
            await adapter.count('_heartbeat_');
          }
        } catch {
          await error('Pool', `Heartbeat failed for persistent connection: ${key}`);
          // Reconnection is handled by layer managers (e.g. L2Manager in data-gateway),
          // not by the pool itself, since the pool doesn't know connection credentials.
        }
      });
    await Promise.allSettled(pings);
  }

  /**
   * Gracefully close evicted idle connections.
   */
  protected async onEvict(evictedItems: Map<string, DatabaseAdapter>): Promise<void> {
    for (const [key, adapter] of evictedItems) {
      await error('Pool', `Closing idle connection: ${key}`);
      await closeAdapter(adapter);
    }
  }

  // ═══════════════════════════════════════════
  //  Pool Observability
  // ═══════════════════════════════════════════

  override getItemsOverview(): AdapterPoolItemOverview[] {
    const now = Date.now();
    const result: AdapterPoolItemOverview[] = [];
    for (const [key, item] of this.items) {
      result.push({
        key: this.formatKey(key),
        // 從 adapter 實例讀取真實資料庫類型（adapter.type 是 readonly）
        dbType: item.value.type,
        isPersistent: item.persistent,
        lastAccessed: item.lastAccessed,
        accessCount: item.accessCount,
        isDirty: item.isDirty,
        persistent: item.persistent,
        idleMs: now - item.lastAccessed,
      });
    }
    return result;
  }

  // ═══════════════════════════════════════════
  //  Graceful Shutdown
  // ═══════════════════════════════════════════

  /**
   * Gracefully shut down all pooled database connections.
   * Should be called from process signal handlers.
   */
  async shutdownAll(): Promise<void> {
    const keys = this.keys();
    // 並行關閉所有連線，避免單一慢 DB 拖長 shutdown 時間
    const closeTasks = keys.map((key) => closeAdapter(this.get(key)));
    await Promise.allSettled(closeTasks);
    this.destroy();
  }
}