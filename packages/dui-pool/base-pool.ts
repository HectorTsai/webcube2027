/**
 * @dui/pool — Generic pooled resource base class
 *
 * Provides LRU/LFU tracking, dirty-flag write-back, idle eviction,
 * and optional heartbeat recovery for any pooled resource type.
 *
 * Subclasses implement the lifecycle hooks:
 *   - onFlush(dirtyItems)  — batch-write dirty data back to storage
 *   - onEvict(evictedItems) — release resources when entries are evicted
 *   - onHeartbeat()         — periodic health check / capacity recovery
 */

import type { PoolItem, PoolOptions } from './types.ts';

export abstract class BasePool<K, V> {
  /** Internal item map with LRU/LFU/dirty metadata */
  protected items = new Map<K, PoolItem<V>>();

  private flushTimer?: number;
  private cleanupTimer?: number;
  private heartbeatTimer?: number;

  constructor(protected options: PoolOptions = {}) {
    // 1. Flush timer — periodic write-back of dirty items
    if (this.options.flushIntervalMs && this.options.flushIntervalMs > 0) {
      this.flushTimer = setInterval(
        () => this.flushToStorage(),
        this.options.flushIntervalMs,
      );
    }

    // 2. Cleanup timer — evict idle entries
    if (
      this.options.cleanupIntervalMs && this.options.cleanupIntervalMs > 0 &&
      this.options.maxIdleMs && this.options.maxIdleMs > 0
    ) {
      this.cleanupTimer = setInterval(
        () => this.cleanupExpired(this.options.maxIdleMs!),
        this.options.cleanupIntervalMs,
      );
    }

    // 3. Heartbeat timer — periodic health check
    if (this.options.heartbeatIntervalMs && this.options.heartbeatIntervalMs > 0) {
      this.heartbeatTimer = setInterval(
        () => this.onHeartbeat(),
        this.options.heartbeatIntervalMs,
      );
    }
  }

  // ═══════════════════════════════════════════
  //  Public API
  // ═══════════════════════════════════════════

  /**
   * Get a value by key. Updates LRU timestamp and access count.
   * Returns `null` if the key does not exist.
   */
  get(key: K): V | null {
    const item = this.items.get(key);
    if (!item) return null;

    item.lastAccessed = Date.now();
    item.accessCount++;
    return item.value;
  }

  /**
   * Set a value by key.
   *
   * @param markDirty — Whether to mark the entry as dirty (needs flush).
   *   Pass `false` for resources that don't need write-back (e.g. DB connections).
   */
  set(key: K, value: V, markDirty = true): void {
    const existing = this.items.get(key);
    this.items.set(key, {
      value,
      lastAccessed: Date.now(),
      accessCount: existing ? existing.accessCount + 1 : 1,
      isDirty: markDirty,
    });
  }

  /** Delete a specific entry. */
  delete(key: K): boolean {
    return this.items.delete(key);
  }

  /** Check if a key exists. */
  has(key: K): boolean {
    return this.items.has(key);
  }

  /** Get all keys currently in the pool. */
  keys(): K[] {
    return Array.from(this.items.keys());
  }

  /**
   * Manually trigger a flush cycle.
   * Collects all dirty entries and calls onFlush(), then clears their dirty flag.
   */
  async flushToStorage(): Promise<void> {
    const dirtyMap = new Map<K, V>();
    for (const [key, item] of this.items.entries()) {
      if (item.isDirty) {
        dirtyMap.set(key, item.value);
        item.isDirty = false;
      }
    }
    if (dirtyMap.size > 0) {
      await this.onFlush(dirtyMap);
    }
  }

  /**
   * Destroy the pool. Stops all timers and clears all entries.
   */
  destroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.items.clear();
  }

  // ═══════════════════════════════════════════
  //  Internal
  // ═══════════════════════════════════════════

  /** Evict entries that have exceeded maxIdleMs since last access. */
  private async cleanupExpired(maxIdleMs: number): Promise<void> {
    const now = Date.now();
    const evictedMap = new Map<K, V>();

    for (const [key, item] of this.items.entries()) {
      if (now - item.lastAccessed > maxIdleMs) {
        evictedMap.set(key, item.value);
        this.items.delete(key);
      }
    }

    if (evictedMap.size > 0) {
      await this.onEvict(evictedMap);
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
   * Called when entries are evicted due to idle timeout.
   * Implement resource cleanup (close connections, free memory) here.
   */
  protected abstract onEvict(evictedItems: Map<K, V>): Promise<void>;

  /**
   * Called periodically if heartbeatIntervalMs is configured.
   * Implement health checks, capacity recovery, etc.
   */
  protected async onHeartbeat(): Promise<void> {
    // optional — subclass may override
  }
}