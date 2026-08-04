// Database Manager — L2/L3 lifecycle + query routing
//
// Migrated from dui-database/pool.ts (PoolCore) into data-gateway.
// dui-database now provides a pure AdapterPool (adapter registry + pool).
// All layer concepts (SYSTEM, per-host tenant) live here.
//
// Responsibilities:
//   - L2 SYSTEM adapter: init (from ConfigStore), reconnect, getter
//   - L3 tenant adapters: init (from L2 site config), cache, getter
//   - Query routing: L3(host) → L2(SYSTEM) fallback

import type { DatabaseAdapter, L2ConnectionInfo } from '@dui/database';
import type { QueryOptions } from '@dui/database/adapter/adapter-interface';
import { createAdapter, AdapterPool } from '@dui/database';
import { decrypt, error as logError, info } from '@dui/util';
import type { ConfigStore } from '@dui/util';

// ── Global pool instance ──

const pool = new AdapterPool();

// ── DbManager ──

export class DbManager {
  private config!: ConfigStore;

  constructor(config: ConfigStore) {
    this.config = config;
  }

  // ═══════════════════════════════════════════════
  //  L2 — SYSTEM
  // ═══════════════════════════════════════════════

  /** The L2 SYSTEM database adapter. `null` until `initL2()` succeeds. */
  get System(): DatabaseAdapter | null {
    return pool.get('SYSTEM');
  }

  /**
   * Initialize the L2 SYSTEM connection from the ConfigStore.
   *
   * Reads `l2_connection` from config, decrypts it, and creates
   * the adapter via the global AdapterPool.
   */
  async initL2(): Promise<void> {
    const encrypted = await this.config.get('l2_connection');
    if (!encrypted) {
      throw new Error('L2 connection info not found in config');
    }

    const decrypted = await decrypt(encrypted);
    let l2Info: Record<string, unknown>;
    try {
      l2Info = JSON.parse(decrypted);
    } catch {
      throw new Error('Failed to parse L2 connection info');
    }

    const adapter = await createAdapter(l2Info.type as string, {
      type: l2Info.type as string,
      host: l2Info.host as string,
      port: l2Info.port as number,
      username: l2Info.username as string,
      password: l2Info.password as string,
      database: l2Info.database as string,
      namespace: l2Info.namespace as string,
      filePath: l2Info.filePath as string,
      credential: l2Info.credential as Record<string, unknown>,
      enabled: true,
    });

    if (!adapter) {
      throw new Error(`Unsupported L2 database type: ${l2Info.type}`);
    }

    pool.set('SYSTEM', adapter, false, true); // persistent, not cold
    await info('DbManager', 'L2 SYSTEM connected');
  }

  // ═══════════════════════════════════════════════
  //  L3 — Tenant (per-host)
  // ═══════════════════════════════════════════════

  /**
   * Initialize an L3 tenant connection for a given host.
   *
   * Reads the site configuration from L2 SYSTEM, decrypts the L3
   * connection info, and creates the adapter.
   *
   * 模式差異：
   * - REDIRECT：不需 L3，直接回傳 null
   * - MIRROR：解析 `設定.mirror_host` 指向來源網站的 L3 連線
   * - PUBLIC / PRIVATE：使用自己的 L3 連線
   */
  async initL3(host: string): Promise<DatabaseAdapter | null> {
    const system = pool.get('SYSTEM');
    if (!system) {
      throw new Error('L2 SYSTEM not initialized — call initL2() first');
    }

    const existing = pool.get(host);
    if (existing) return existing; // already connected

    const resolved = await this.resolveL3Connection(host);
    if (!resolved) return null;

    const connInfo = { ...resolved, enabled: true } as unknown as L2ConnectionInfo;
    const adapter = await createAdapter(connInfo.type, connInfo);

    if (!adapter) return null;

    pool.set(host, adapter, false, false); // evictable
    await info('DbManager', `L3 connected for ${host}`);
    return adapter;
  }

  /**
   * 解析 host 實際使用的 L3 連線資訊：
   * - REDIRECT → null（不需 L3）
   * - MIRROR → 追蹤 `設定.mirror_host` 鏈，直到找到有真實連線的來源網站
   * - PUBLIC / PRIVATE → 自己的 `資料庫` 連線
   * 以 visited set 防止 mirror 鏈成環造成無限迴圈。
   */
  private async resolveL3Connection(host: string): Promise<Record<string, unknown> | null> {
    const seen = new Set<string>();
    let current = host;
    while (!seen.has(current)) {
      seen.add(current);
      const siteConfig = await this.getSiteConfig(current);
      if (!siteConfig) return null;
      if (siteConfig.模式 === 'REDIRECT') return null;
      if (siteConfig.l3Connection) return siteConfig.l3Connection;
      // MIRROR：追蹤來源
      const mirrorHost = siteConfig.設定?.['mirror_host'];
      if (siteConfig.模式 === 'MIRROR' && mirrorHost && mirrorHost !== current) {
        current = mirrorHost;
        continue;
      }
      return null;
    }
    return null; // 偵測到 mirror 循環
  }

  /**
   * Get the L3 adapter for a given host.
   * Returns `null` if not connected.
   */
  getL3(host: string): DatabaseAdapter | null {
    return pool.get(host);
  }

  /**
   * 確保指定租戶的 L3 adapter 已連線。
   *
   * 有 host 的 CRUD 操作一律先呼叫本方法：
   *   - 已連線 → 直接回傳
   *   - 未連線 → 嘗試 `initL3()`（依網站設定建立連線）
   *   - 網站不存在／REDIRECT／MIRROR 無來源／連線資訊缺失 → 拋錯
   *
   * 不再靜默降級至 L2，讓呼叫端能明確得知「租戶 L3 不存在」。
   */
  private async ensureL3(host: string): Promise<DatabaseAdapter> {
    const existing = pool.get(host);
    if (existing) return existing;

    const l3 = await this.initL3(host);
    if (!l3) {
      throw new Error(`租戶 ${host} 的 L3 資料庫不存在或未設定`);
    }
    return l3;
  }

  // ═══════════════════════════════════════════════
  //  Site config
  // ═══════════════════════════════════════════════

  /**
   * Read a site's configuration from the L2 SYSTEM database.
   * Returns the mode, 設定, and L3 connection info if available.
   */
  private async getSiteConfig(
    host: string,
  ): Promise<{
    模式?: string;
    設定?: Record<string, string>;
    l3Connection?: Record<string, unknown>;
  } | null> {
    const system = pool.get('SYSTEM');
    if (!system) return null;

    try {
      const record = await system.getById(`網站資訊:網站資訊:${host}`);
      if (!record) return null;

      const config: {
        模式?: string;
        設定?: Record<string, string>;
        l3Connection?: Record<string, unknown>;
      } = {
        模式: (record.模式 as string) || 'PUBLIC',
        設定: (record.設定 as Record<string, string>) || {},
      };

      // 新格式：L3 連線資訊加密於 `資料庫` 欄位（site/apply 寫入）
      const raw = (record.資料庫 as string | undefined) ??
        (record.l3Connection as string | undefined);
      if (raw && typeof raw === 'string') {
        const decrypted = await decrypt(raw);
        config.l3Connection = JSON.parse(decrypted);
      } else if (record.l3Connection && typeof record.l3Connection === 'object') {
        // 舊格式 fallback：l3Connection 直接存放物件
        config.l3Connection = record.l3Connection as Record<string, unknown>;
      }

      return config;
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════
  //  Query routing
  // ═══════════════════════════════════════════════

  /**
   * List records from a collection, optionally filtered by model type.
   *
   * Routing (host-based):
   *   - `host` provided → L3(host)
   *   - `host` NOT provided → L2(SYSTEM)
   */
  async list(
    collection: string,
    modelType?: string,
    options?: QueryOptions,
    host?: string,
  ): Promise<Record<string, unknown>[]> {
    if (host) {
      const l3 = await this.ensureL3(host);
      return await l3.list(collection, modelType, options);
    }
    const system = pool.get('SYSTEM');
    if (system) return await system.list(collection, modelType, options);
    throw new Error('No database available');
  }

  /**
   * Get a single record by composite ID.
   *
   * Routing:
   *   - `host` provided → L3(host)（不存在則拋錯，不降級 L2）
   *   - `host` NOT provided → L2(SYSTEM)
   */
  async getById(id: string, host?: string): Promise<Record<string, unknown> | null> {
    if (host) {
      const l3 = await this.ensureL3(host);
      return await l3.getById(id);
    }
    const system = pool.get('SYSTEM');
    if (system) return await system.getById(id);
    return null;
  }

  /**
   * Create a new record.
   *
   * Routing:
   *   - `host` provided → L3(host)（不存在則拋錯，不降級 L2）
   *   - `host` NOT provided → L2(SYSTEM)
   */
  async create(
    collection: string,
    id: string,
    data: Record<string, unknown>,
    host?: string,
  ): Promise<Record<string, unknown>> {
    if (host) {
      const l3 = await this.ensureL3(host);
      return await l3.create(collection, id, data);
    }
    const system = pool.get('SYSTEM');
    if (system) return await system.create(collection, id, data);
    throw new Error('No database available');
  }

  /**
   * Update an existing record (upsert).
   */
  async update(
    collection: string,
    id: string,
    data: Record<string, unknown>,
    host?: string,
  ): Promise<Record<string, unknown>> {
    if (host) {
      const l3 = await this.ensureL3(host);
      return await l3.update(collection, id, data);
    }
    const system = pool.get('SYSTEM');
    if (system) return await system.update(collection, id, data);
    throw new Error('No database available');
  }

  /**
   * Partial update (patch).
   */
  async patch(
    collection: string,
    id: string,
    fields: Record<string, unknown>,
    host?: string,
  ): Promise<Record<string, unknown> | null> {
    if (host) {
      const l3 = await this.ensureL3(host);
      return await l3.patch(collection, id, fields);
    }
    const system = pool.get('SYSTEM');
    if (system) return await system.patch(collection, id, fields);
    throw new Error('No database available');
  }

  /**
   * Delete a record by composite ID.
   */
  async deleteRecord(id: string, host?: string): Promise<{ success: boolean }> {
    if (host) {
      const l3 = await this.ensureL3(host);
      const ok = await l3.delete(id);
      return { success: ok };
    }
    const system = pool.get('SYSTEM');
    if (system) {
      const ok = await system.delete(id);
      return { success: ok };
    }
    return { success: false };
  }

  // ═══════════════════════════════════════════════
  //  Utilities
  // ═══════════════════════════════════════════════

  /** Test a database connection (uses the pool's testConnection). */
  async testConnection(info: Record<string, unknown>): Promise<{ ok: boolean; message: string }> {
    return await pool.testConnection(info as any);
  }

  /** Get a summary of all pooled connections (for health/admin UI). */
  getPoolOverview() {
    return pool.getItemsOverview();
  }

  /** Get the full pool status snapshot (capacity, hit rate, errors, etc.). */
  getPoolStatus() {
    return pool.getStatus();
  }

  /**
   * Get pool status + item overview combined.
   * Useful for /api/health and future monitoring dashboards.
   */
  getPoolSnapshot() {
    return {
      status: pool.getStatus(),
      items: pool.getItemsOverview(),
    };
  }

  /** Gracefully shut down all pool connections. */
  async shutdownAll(): Promise<void> {
    await pool.shutdownAll();
    await info('DbManager', 'All connections closed');
  }
}

// ── Global singleton accessor (for routes/handlers) ──

let _instance: DbManager | null = null;

export function setDbManager(instance: DbManager): void {
  _instance = instance;
}

export function getDbManager(): DbManager {
  if (!_instance) throw new Error('DbManager 尚未初始化');
  return _instance;
}