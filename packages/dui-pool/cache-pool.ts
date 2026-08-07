/**
 * @dui/pool — CachePool: read-through caching layer
 *
 * Extends BasePool with:
 * - `getOrFetch(key, fetcher, ttlMs?)` — read-through: miss → fetch → cache
 * - TTL support (time-to-live expiry, separate from idle eviction)
 * - `invalidateByPrefix(prefix)` — batch invalidate by key prefix
 * - `clearCache()` — clear non-dirty entries only
 * - Enhanced status with `avgIdleMs` and `utilizationRate`
 */

import { BasePool } from './base-pool.ts';
import type { PoolOptions, PoolStatus } from './types.ts';

export class CachePool<K, V> extends BasePool<K, V> {
  /** TTL expiry timestamps per key. Key → expiry ms timestamp. */
  protected ttlMap = new Map<K, number>();

  constructor(options: PoolOptions = {}) {
    super(options);
  }

  // ═══════════════════════════════════════════════════════════
  //  BasePool abstract hook implementations
  // ═══════════════════════════════════════════════════════════

  protected async onFlush(_dirtyItems: Map<K, V>): Promise<void> {
    // CachePool entries are read-through copies, no external flush needed
  }

  protected async onEvict(_evictedItems: Map<K, V>): Promise<void> {
    // CachePool entries are plain values, no external resource to release
  }

  // ═══════════════════════════════════════════════════════════
  //  Read-through
  // ═══════════════════════════════════════════════════════════

  /**
   * Read-through: get from cache. If miss, call `fetcher`, store result, return.
   *
   * @param key     Cache key
   * @param fetcher Async function to fetch value on cache miss
   * @param ttlMs   Optional TTL in ms (auto-evict after this time)
   * @returns Cached or fetched value, or `null` if fetcher returns null
   */
  async getOrFetch(key: K, fetcher: (key: K) => Promise<V | null>, ttlMs?: number): Promise<V | null> {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const value = await fetcher(key);
    if (value !== null) {
      this.set(key, value, /* markDirty */ false, /* persistent */ false, ttlMs);
    }
    return value;
  }

  // ═══════════════════════════════════════════════════════════
  //  TTL-aware get/set
  // ═══════════════════════════════════════════════════════════

  /**
   * Get with TTL check. Expired entries are treated as miss.
   */
  override get(key: K): V | null {
    const expiry = this.ttlMap.get(key);
    if (expiry !== undefined && expiry <= Date.now()) {
      this.items.delete(key);
      this.ttlMap.delete(key);
      this._evictions++;
      return null;
    }
    return super.get(key);
  }

  /**
   * Set with optional TTL.
   *
   * @param markDirty  Defaults to `false` (CachePool entries are read-through copies,
   *                   not write-back documents). Pass `true` if you need dirty tracking.
   * @param persistent  Immune to idle eviction
   * @param ttlMs       Optional TTL in ms (entry auto-evicts after this time)
   */
  override set(key: K, value: V, markDirty = false, persistent = false, ttlMs?: number): void {
    super.set(key, value, markDirty, persistent);

    if (ttlMs !== undefined && ttlMs > 0) {
      this.ttlMap.set(key, Date.now() + ttlMs);
    } else {
      this.ttlMap.delete(key);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Batch operations
  // ═══════════════════════════════════════════════════════════

  /**
   * Invalidate all cache entries whose key starts with `prefix`.
   * Does NOT evict dirty entries (they need to be flushed first).
   *
   * @returns Number of entries invalidated
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.items.keys()) {
      const keyStr = String(key);
      if (keyStr.startsWith(prefix)) {
        const item = this.items.get(key);
        if (item && item.isDirty) continue; // skip dirty — needs flush
        this.items.delete(key);
        this.ttlMap.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all non-dirty cache entries.
   * Dirty entries are preserved for flushing.
   *
   * @returns Number of entries cleared
   */
  clearCache(): number {
    let count = 0;
    for (const [key, item] of this.items.entries()) {
      if (!item.isDirty) {
        this.items.delete(key);
        this.ttlMap.delete(key);
        count++;
      }
    }
    return count;
  }

  // ═══════════════════════════════════════════════════════════
  //  Enhanced status
  // ═══════════════════════════════════════════════════════════

  override getStatus(): PoolStatus & { avgIdleMs: number | null; utilizationRate: number } {
    const base = super.getStatus();
    const now = Date.now();
    let totalIdle = 0;
    let idleCount = 0;

    for (const item of this.items.values()) {
      totalIdle += now - item.lastAccessed;
      idleCount++;
    }

    return {
      ...base,
      avgIdleMs: idleCount > 0 ? totalIdle / idleCount : null,
      utilizationRate: base.hitRate, // hit rate ≈ utilization
    };
  }
}