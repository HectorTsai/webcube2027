/**
 * @dui/pool — Pool item and configuration types
 */

/**
 * A pooled item with LRU/LFU tracking metadata.
 */
export interface PoolItem<V> {
  /** The actual cached/stored value */
  value: V;
  /** Last access timestamp (ms) — used for LRU eviction */
  lastAccessed: number;
  /** Total access count — used for LFU ranking */
  accessCount: number;
  /** Whether the value has been modified and needs to be flushed back to storage */
  isDirty: boolean;
}

/**
 * Options for configuring a BasePool instance.
 *
 * All intervals are optional. Only the timers you set will be started.
 */
export interface PoolOptions {
  /** Flush interval (ms). Schedules periodic flushToStorage() for dirty items. */
  flushIntervalMs?: number;
  /** Cleanup interval (ms). Schedules periodic eviction of idle entries. */
  cleanupIntervalMs?: number;
  /** Max idle time (ms). Entries not accessed within this window are evicted. */
  maxIdleMs?: number;
  /** Heartbeat interval (ms). Schedules periodic onHeartbeat() calls. */
  heartbeatIntervalMs?: number;
}