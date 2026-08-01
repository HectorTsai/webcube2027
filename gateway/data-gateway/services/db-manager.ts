// Database Manager — L2/L3 lifecycle + query routing
//
// Migrated from dui-database/pool.ts (PoolCore) into data-gateway.
// dui-database now provides a pure AdapterPool (adapter registry + pool).
// All layer concepts (SYSTEM, per-host tenant) live here.
//
// Responsibilities:
//   - L2 SYSTEM adapter: init (from ConfigStore), reconnect, getter
//   - L3 tenant adapters: init (from L2 site config), cache, getter
//   - Query routing: L3(host) → L2(SYSTEM) fallback, L2+L3 merge (scope=all)

import type { DatabaseAdapter } from '@dui/database';
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
   */
  async initL3(host: string): Promise<DatabaseAdapter | null> {
    const system = pool.get('SYSTEM');
    if (!system) {
      throw new Error('L2 SYSTEM not initialized — call initL2() first');
    }

    const siteConfig = await this.getSiteConfig(host);
    if (!siteConfig?.l3Connection) {
      return null;
    }

    const existing = pool.get(host);
    if (existing) return existing; // already connected

    const { l3Connection } = siteConfig;
    const adapter = await createAdapter(l3Connection.type as string, {
      ...l3Connection,
      enabled: true,
    });

    if (!adapter) return null;

    pool.set(host, adapter, false, false); // evictable
    await info('DbManager', `L3 connected for ${host}`);
    return adapter;
  }

  /**
   * Get the L3 adapter for a given host.
   * Returns `null` if not connected.
   */
  getL3(host: string): DatabaseAdapter | null {
    return pool.get(host);
  }

  // ═══════════════════════════════════════════════
  //  Site config
  // ═══════════════════════════════════════════════

  /**
   * Read a site's configuration from the L2 SYSTEM database.
   * Returns the L3 connection info if available.
   */
  private async getSiteConfig(
    host: string,
  ): Promise<{ l3Connection?: Record<string, unknown> } | null> {
    const system = pool.get('SYSTEM');
    if (!system) return null;

    try {
      const record = await system.getById(`網站資訊:網站資訊:${host}`);
      if (!record) return null;

      const raw = record.l3Connection as string | undefined;
      if (raw) {
        const decrypted = await decrypt(raw);
        return { l3Connection: JSON.parse(decrypted) };
      }

      return record as { l3Connection?: Record<string, unknown> };
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
   *
   * For the legacy `scope=all` pattern, use `listAll()` instead.
   */
  async list(
    collection: string,
    modelType?: string,
    options?: QueryOptions,
    host?: string,
  ): Promise<Record<string, unknown>[]> {
    if (host) {
      const l3 = pool.get(host);
      if (l3) return await l3.list(collection, modelType, options);
    }
    const system = pool.get('SYSTEM');
    if (system) return await system.list(collection, modelType, options);
    throw new Error('No database available');
  }

  /**
   * List all records across L2 + all connected L3 tenants.
   * Used by admin/manager UIs with `scope=all`.
   *
   * Results are deduplicated by `id` (L2 priority, then L3).
   */
  async listAll(
    collection: string,
    modelType?: string,
    options?: QueryOptions,
  ): Promise<Record<string, unknown>[]> {
    const system = pool.get('SYSTEM');
    const allResults: Map<string, Record<string, unknown>> = new Map();

    // L2 first (priority)
    if (system) {
      const records = await system.list(collection, modelType, options);
      for (const r of records) {
        const id = r.id as string;
        if (id) allResults.set(id, r);
      }
    }

    // Then L3 tenants
    for (const key of pool.keys()) {
      if (key === 'SYSTEM') continue;
      const l3 = pool.get(key);
      if (!l3) continue;
      try {
        const records = await l3.list(collection, modelType, options);
        for (const r of records) {
          const id = r.id as string;
          if (id && !allResults.has(id)) {
            allResults.set(id, r);
          }
        }
      } catch {
        // skip failed tenant
      }
    }

    return Array.from(allResults.values());
  }

  /**
   * Get a single record by composite ID.
   *
   * Routing:
   *   - `host` provided → L3(host) first, fallback to L2
   *   - `host` NOT provided → L2(SYSTEM)
   */
  async getById(id: string, host?: string): Promise<Record<string, unknown> | null> {
    if (host) {
      const l3 = pool.get(host);
      if (l3) {
        const result = await l3.getById(id);
        if (result) return result;
      }
    }
    const system = pool.get('SYSTEM');
    if (system) return await system.getById(id);
    return null;
  }

  /**
   * Create a new record.
   *
   * Routing:
   *   - `host` provided → L3(host)
   *   - `host` NOT provided → L2(SYSTEM)
   */
  async create(
    collection: string,
    id: string,
    data: Record<string, unknown>,
    host?: string,
  ): Promise<Record<string, unknown>> {
    if (host) {
      const l3 = pool.get(host);
      if (l3) return await l3.create(collection, id, data);
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
      const l3 = pool.get(host);
      if (l3) return await l3.update(collection, id, data);
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
      const l3 = pool.get(host);
      if (l3) return await l3.patch(collection, id, fields);
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
      const l3 = pool.get(host);
      if (l3) {
        const ok = await l3.delete(id);
        return { success: ok };
      }
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