/**
 * @dui/pool — Generic pooled resource base class
 *
 * Provides LRU/LFU tracking, dirty-flag write-back, idle eviction,
 * soft/hard watermark protection, O(1) LRU via Map reordering,
 * min-size warmup, optional heartbeat recovery, and built-in
 * observability (metrics + status snapshot + item overview).
 *
 * Subclasses implement the lifecycle hooks:
 *   - onFlush(dirtyItems)   — batch-write dirty data back to storage
 *   - onEvict(evictedItems)  — release resources when entries are evicted
 *   - onHeartbeat()          — periodic health check / capacity recovery
 *   - onWarmup(count)        — optional: pre-create resources when below minSize
 */

import type { PoolItem, PoolOptions, PoolItemOverview, PoolStatus } from './types.ts';
import { error as logError } from '@dui/util';

// ─── PoolFullError ────────────────────────────────────────────

export class PoolFullError extends Error {
  override readonly name = 'PoolFullError';
  constructor(message: string) {
    super(message);
  }
}

// ─── BasePool ─────────────────────────────────────────────────

export abstract class BasePool<K, V> {
  /** Internal item map — insertion order = access order (LRU at front) */
  protected items = new Map<K, PoolItem<V>>();

  private flushTimer?: ReturnType<typeof setInterval>;
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  /** Guards against overlapping flush cycles */
  private _isFlushing = false;
  /** Guards against overlapping cleanup cycles */
  private _isCleaning = false;
  /** Guards against overlapping heartbeat cycles */
  private _isHeartbeating = false;
  /** Debounce flag for soft watermark background trimming */
  private _isTrimming = false;

  // ── Observability counters (v0.3.0) ──────────────────────

  private _hits = 0;
  private _misses = 0;
  private _evictions = 0;
  private _flushes = 0;
  private _flushErrors = 0;
  private _lastFlushAt: number | null = null;
  private _lastCleanupAt: number | null = null;
  private _lastHeartbeatAt: number | null = null;
  private _lastError: { time: number; message: string } | null = null;

  constructor(protected options: PoolOptions = {}) {
    // 1. Flush timer — periodic write-back of dirty items
    if (this.options.flushIntervalMs && this.options.flushIntervalMs > 0) {
      this.flushTimer = setInterval(async () => {
        if (this._isFlushing) return;
        this._isFlushing = true;
        try {
          await this.flushToStorage();
          this._lastFlushAt = Date.now();
        } catch (err) {
          this._lastError = { time: Date.now(), message: String(err) };
          logError('BasePool', `Auto flush error: ${err}`);
        } finally {
          this._isFlushing = false;
        }
      }, this.options.flushIntervalMs);
    }

    // 2. Cleanup timer — evict idle entries
    if (
      this.options.cleanupIntervalMs && this.options.cleanupIntervalMs > 0 &&
      this.options.maxIdleMs && this.options.maxIdleMs > 0
    ) {
      this.cleanupTimer = setInterval(async () => {
        if (this._isCleaning) return;
        this._isCleaning = true;
        try {
          await this.cleanupExpired(this.options.maxIdleMs!);
          this._lastCleanupAt = Date.now();
        } catch (err) {
          this._lastError = { time: Date.now(), message: String(err) };
          logError('BasePool', `Auto cleanup error: ${err}`);
        } finally {
          this._isCleaning = false;
        }
      }, this.options.cleanupIntervalMs);
    }

    // 3. Heartbeat timer — periodic health check + min-size warmup
    if (this.options.heartbeatIntervalMs && this.options.heartbeatIntervalMs > 0) {
      this.heartbeatTimer = setInterval(async () => {
        if (this._isHeartbeating) return;
        this._isHeartbeating = true;
        try {
          await this.onHeartbeat();
          await this._warmupIfNeeded();
          this._lastHeartbeatAt = Date.now();
        } catch (err) {
          this._lastError = { time: Date.now(), message: String(err) };
          logError('BasePool', `Auto heartbeat error: ${err}`);
        } finally {
          this._isHeartbeating = false;
        }
      }, this.options.heartbeatIntervalMs);
    }
  }

  // ═══════════════════════════════════════════
  //  Public API
  // ═══════════════════════════════════════════

  /**
   * Get a value by key.
   * - Updates LRU timestamp and access count.
   * - Re-inserts the key at the Map tail for O(1) LRU ordering.
   * - Tracks hit/miss for metrics.
   * Returns `null` if the key does not exist.
   */
  get(key: K): V | null {
    const item = this.items.get(key);
    if (!item) {
      this._misses++;
      return null;
    }

    this._hits++;

    // O(1) LRU: move to end (most recently used)
    this.items.delete(key);
    this.items.set(key, item);

    item.lastAccessed = Date.now();
    item.accessCount++;
    return item.value;
  }

  /**
   * Set a value by key.
   *
   * @param markDirty — Whether to mark the entry as dirty (needs flush).
   *   Pass `false` for resources that don't need write-back (e.g. DB connections).
   * @param persistent — Whether the entry should NEVER be evicted by idle cleanup.
   *   Persistent entries are also pinged by `onHeartbeat()`.
   *
   * @throws {PoolFullError} When hard capacity limit is reached and no item is evictable.
   */
  set(key: K, value: V, markDirty = true, persistent = false): void {
    const existing = this.items.get(key);
    const isNewKey = !existing;

    // Hard limit check for new keys
    if (isNewKey && this.options.maxSize && this.options.maxSize > 0) {
      if (this.items.size >= this.options.maxSize) {
        // Emergency synchronous eviction: try to free one slot
        const evicted = this._evictLru(1, /* includePersistent */ false);
        if (evicted.size === 0) {
          throw new PoolFullError(
            `Pool at capacity ${this.items.size}/${this.options.maxSize} ` +
            `with no evictable (non-persistent) entries`,
          );
        }
        // Fire onEvict asynchronously — data already removed from map
        queueMicrotask(() => {
          this.onEvict(evicted).catch((err) => {
            logError('BasePool', `Hard-limit onEvict failed: ${err}`);
          });
        });
      }
    }

    // O(1) LRU: move existing key to tail
    if (existing) {
      this.items.delete(key);
    }

    this.items.set(key, {
      value,
      lastAccessed: Date.now(),
      accessCount: existing ? existing.accessCount + 1 : 1,
      isDirty: markDirty,
      persistent,
    });

    // Soft watermark check for new keys
    if (isNewKey) {
      this._checkSoftWatermark();
    }
  }

  /**
   * Delete a specific entry.
   * Flushes dirty data first (if any), then calls onEvict for resource cleanup.
   */
  async delete(key: K): Promise<boolean> {
    const item = this.items.get(key);
    if (!item) return false;

    // Wait for background flush to finish (avoid race condition)
    while (this._isFlushing) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Flush dirty data first to prevent data loss
    if (item.isDirty) {
      const flushMap = new Map<K, V>([[key, item.value]]);
      try {
        await this.onFlush(flushMap);
      } catch (err) {
        this._lastError = { time: Date.now(), message: String(err) };
        logError('BasePool', `Flush on delete failed for key ${key}: ${err}`);
        throw err;
      }
    }

    // Release underlying resource
    const evictMap = new Map<K, V>([[key, item.value]]);
    await this.onEvict(evictMap);

    this.items.delete(key);
    return true;
  }

  /** Check if a key exists. */
  has(key: K): boolean {
    return this.items.has(key);
  }

  /**
   * Get all keys currently in the pool (allocates an array).
   * For large pools, prefer `keysIterator()` for streaming iteration.
   */
  keys(): K[] {
    return Array.from(this.items.keys());
  }

  /**
   * Streaming iterator over pool keys — avoids allocating a full array.
   * Useful for large capacity pools.
   */
  keysIterator(): IterableIterator<K> {
    return this.items.keys();
  }

  /**
   * Manually trigger a flush cycle.
   * Collects all dirty entries and calls onFlush(), then clears their dirty flag.
   */
  async flushToStorage(): Promise<void> {
    const dirtyItems: Array<[K, PoolItem<V>]> = [];
    for (const [key, item] of this.items.entries()) {
      if (item.isDirty) {
        dirtyItems.push([key, item]);
      }
    }
    if (dirtyItems.length === 0) return;

    const dirtyMap = new Map<K, V>();
    for (const [key, item] of dirtyItems) {
      dirtyMap.set(key, item.value);
    }

    try {
      await this.onFlush(dirtyMap);
      this._flushes++;
      this._lastFlushAt = Date.now();
    } catch (err) {
      this._flushErrors++;
      this._lastError = { time: Date.now(), message: String(err) };
      throw err;
    }

    // Only clear dirty flag after successful flush
    for (const [_, item] of dirtyItems) {
      item.isDirty = false;
    }
  }

  /**
   * Destroy the pool. Stops all timers, flushes remaining dirty items,
   * releases all resources via onEvict, then clears internal state.
   */
  async destroy(): Promise<void> {
    // 1. Stop all timers first (no new cycles)
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    // 2. Wait for running background tasks to finish (avoid race condition)
    while (this._isFlushing || this._isCleaning || this._isHeartbeating) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // 3. Flush remaining dirty items (reuse flushToStorage to avoid duplication)
    try {
      await this.flushToStorage();
    } catch (err) {
      logError('BasePool', `Final flush on destroy failed: ${err}`);
    }

    // 4. Evict all remaining items (release connections, etc.)
    if (this.items.size > 0) {
      const evictMap = new Map<K, V>();
      for (const [key, item] of this.items) {
        evictMap.set(key, item.value);
      }
      try {
        await this.onEvict(evictMap);
      } catch (err) {
        this._lastError = { time: Date.now(), message: String(err) };
        logError('BasePool', `Final evict on destroy failed: ${err}`);
      }
    }

    this.items.clear();
  }

  // ═══════════════════════════════════════════
  //  Observability (v0.3.0)
  // ═══════════════════════════════════════════

  /**
   * Return a full status snapshot of the pool.
   * Suitable for Dashboard polling or WebSocket delivery.
   */
  getStatus(): PoolStatus {
    const totalItems = this.items.size;
    let persistentItems = 0;
    let dirtyItems = 0;

    for (const item of this.items.values()) {
      if (item.persistent) persistentItems++;
      if (item.isDirty) dirtyItems++;
    }

    const totalLookups = this._hits + this._misses;

    return {
      // Capacity
      totalItems,
      persistentItems,
      dirtyItems,
      capacityUsage:
        this.options.maxSize && this.options.maxSize > 0
          ? totalItems / this.options.maxSize
          : null,

      // Performance
      hits: this._hits,
      misses: this._misses,
      hitRate: totalLookups > 0 ? this._hits / totalLookups : 0,
      evictions: this._evictions,
      flushes: this._flushes,
      flushErrors: this._flushErrors,

      // Runtime state
      isFlushing: this._isFlushing,
      isCleaning: this._isCleaning,
      isHeartbeating: this._isHeartbeating,

      // Timestamps
      lastFlushAt: this._lastFlushAt,
      lastCleanupAt: this._lastCleanupAt,
      lastHeartbeatAt: this._lastHeartbeatAt,

      // Last error
      lastError: this._lastError,
    };
  }

  /**
   * Reset all cumulative performance counters.
   * Does NOT reset timestamps or lastError (those are diagnostics,
   * not performance metrics).
   */
  resetMetrics(): void {
    this._hits = 0;
    this._misses = 0;
    this._evictions = 0;
    this._flushes = 0;
    this._flushErrors = 0;
  }

  /**
   * Get an overview of all items with metadata (no value exposure).
   * Returns items in Map order (= LRU order, oldest first).
   *
   * Subclasses can override to add typed fields (e.g. dbName).
   */
  getItemsOverview(): PoolItemOverview[] {
    const now = Date.now();
    const result: PoolItemOverview[] = [];
    for (const [key, item] of this.items) {
      result.push({
        key: this.formatKey(key),
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
  //  Internal
  // ═══════════════════════════════════════════

  /**
   * Evict the least recently used (non-persistent) entries from the front of the Map.
   *
   * @param count — Number of entries to evict.
   * @param includePersistent — Whether to also evict persistent entries (emergency use only).
   * @returns The evicted entries map.
   */
  private _evictLru(count: number, includePersistent = false): Map<K, V> {
    const evicted = new Map<K, V>();
    const toDelete: K[] = [];

    for (const [key, item] of this.items) {
      if (evicted.size >= count) break;
      if (!includePersistent && item.persistent) continue;
      evicted.set(key, item.value);
      toDelete.push(key);
    }

    for (const key of toDelete) {
      this.items.delete(key);
    }

    this._evictions += evicted.size;

    return evicted;
  }

  /**
   * Check soft watermark after insertion.
   * If pool exceeds highWatermarkRatio × maxSize, schedule background LRU eviction
   * via queueMicrotask — does NOT block the caller.
   * Uses _isTrimming debounce: rapid bulk inserts only trigger one cycle.
   */
  private _checkSoftWatermark(): void {
    const maxSize = this.options.maxSize;
    const ratio = this.options.highWatermarkRatio ?? 0.8;
    if (!maxSize || maxSize <= 0 || this._isTrimming) return;

    const currentSize = this.items.size;
    const threshold = Math.floor(maxSize * ratio);

    if (currentSize >= threshold) {
      this._isTrimming = true;

      // Target: evict down to (ratio - 10%) × maxSize, but not below minSize
      const targetRatio = Math.max(ratio - 0.1, 0);
      const targetSize = Math.max(
        Math.floor(maxSize * targetRatio),
        this.options.minSize ?? 0,
      );
      const toEvict = currentSize - targetSize;

      if (toEvict <= 0) {
        this._isTrimming = false;
        return;
      }

      const evicted = this._evictLru(toEvict, /* includePersistent */ false);
      if (evicted.size > 0) {
        queueMicrotask(() => {
          this.onEvict(evicted)
            .catch((err) => {
              this._lastError = { time: Date.now(), message: String(err) };
              logError('BasePool', `Soft watermark onEvict failed: ${err}`);
            })
            .finally(() => {
              this._isTrimming = false;
            });
        });
      } else {
        this._isTrimming = false;
      }
    }
  }

  /**
   * If minSize is configured and pool is below it, call onWarmup() to
   * pre-create resources.
   */
  private async _warmupIfNeeded(): Promise<void> {
    const minSize = this.options.minSize;
    if (!minSize || minSize <= 0) return;
    if (this.items.size >= minSize) return;

    const deficit = minSize - this.items.size;
    try {
      await this.onWarmup(deficit);
    } catch (err) {
      this._lastError = { time: Date.now(), message: String(err) };
      logError('BasePool', `MinSize warmup failed (needed ${deficit}): ${err}`);
    }
  }

  /** Evict entries that have exceeded maxIdleMs since last access. */
  private async cleanupExpired(maxIdleMs: number): Promise<void> {
    const now = Date.now();
    const expiredDirty: Array<[K, PoolItem<V>]> = [];
    const expiredClean: Array<[K, PoolItem<V>]> = [];

    for (const [key, item] of this.items.entries()) {
      if (!item.persistent && now - item.lastAccessed > maxIdleMs) {
        if (item.isDirty) {
          expiredDirty.push([key, item]);
        } else {
          expiredClean.push([key, item]);
        }
      }
    }

    // Flush dirty expired items first to prevent data loss
    if (expiredDirty.length > 0) {
      const flushMap = new Map<K, V>();
      for (const [key, item] of expiredDirty) {
        flushMap.set(key, item.value);
      }
      try {
        await this.onFlush(flushMap);
        this._flushes++;
        for (const [_, item] of expiredDirty) {
          item.isDirty = false;
        }
      } catch (err) {
        this._flushErrors++;
        this._lastError = { time: Date.now(), message: String(err) };
        logError(
          'BasePool',
          `Flush on cleanup failed for ${expiredDirty.length} item(s): ${err}`,
        );
        // Keep isDirty = true, don't evict — retry on next cycle
        return;
      }
    }

    // Evict all expired items (now clean)
    const allExpired = [...expiredDirty, ...expiredClean];
    if (allExpired.length > 0) {
      this._evictions += allExpired.length;
      const evictMap = new Map<K, V>();
      for (const [key, item] of allExpired) {
        evictMap.set(key, item.value);
        this.items.delete(key);
      }
      await this.onEvict(evictMap);
    }
  }

  // ═══════════════════════════════════════════
  //  Lifecycle Hooks (override in subclass)
  // ═══════════════════════════════════════════

  /**
   * Called when dirty entries need to be written back to storage.
   * Implement batch-update logic here.
   */
  protected abstract onFlush(dirtyItems: Map<K, V>): Promise<void>;

  /**
   * Called when entries are evicted due to idle timeout, watermark protection,
   * or manual delete(). Implement resource cleanup (close connections, free memory) here.
   */
  protected abstract onEvict(evictedItems: Map<K, V>): Promise<void>;

  /**
   * Called periodically if heartbeatIntervalMs is configured.
   * Implement health checks, capacity recovery, etc.
   * v0.3.0: heartbeat completion auto-records `_lastHeartbeatAt`.
   */
  protected async onHeartbeat(): Promise<void> {
    // optional — subclass may override
  }

  /**
   * Called during heartbeat when pool size is below minSize.
   * Implement resource pre-creation (open connections, allocate buffers) here.
   *
   * @param deficit — Number of additional entries needed to reach minSize.
   */
  protected async onWarmup(deficit: number): Promise<void> {
    // optional — subclass may override
  }

  /**
   * Format a pool key into a human-readable string for observability output.
   *
   * Default implementation uses JSON.stringify for objects/arrays,
   * falling back to String() for primitives or on serialization error.
   *
   * Subclasses with typed keys (e.g. `K = string`) can override for
   * cleaner output.
   */
  protected formatKey(key: K): string {
    if (typeof key === 'object' && key !== null) {
      try {
        return JSON.stringify(key);
      } catch {
        return String(key);
      }
    }
    return String(key);
  }
}