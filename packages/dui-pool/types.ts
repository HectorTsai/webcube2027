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
  /**
   * Whether this item should never be evicted by idle cleanup.
   * Persistent items are also pinged periodically by onHeartbeat()
   * to keep the connection alive from the server side.
   *
   * Set via `pool.set(key, value, markDirty, persistent)`.
   */
  persistent: boolean;
}

/**
 * Options for configuring a BasePool instance.
 *
 * All intervals are optional. Only the timers you set will be started.
 *
 * @since 0.2.0 — added `maxSize`, `highWatermarkRatio`, `minSize` for
 *   watermark protection and capacity management.
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

  // ── Capacity management (v0.2.0) ──────────────────────────

  /**
   * Hard capacity limit. When the pool reaches this size, new insertions
   * trigger synchronous LRU eviction. Throws `PoolFullError` if no
   * evictable (non-persistent) entries remain.
   */
  maxSize?: number;

  /**
   * Soft watermark ratio (0.0–1.0, default 0.8 = 80%).
   * When pool size exceeds `maxSize × highWatermarkRatio`, background
   * LRU eviction is scheduled via `queueMicrotask` — non-blocking.
   */
  highWatermarkRatio?: number;

  /**
   * Minimum pool size. During heartbeat, if the pool falls below this
   * threshold, `onWarmup(deficit)` is called to pre-create resources.
   */
  minSize?: number;
}

// ── Observability (v0.3.0) ───────────────────────────────

/**
 * Read-only metadata for a single pooled item (no value exposure).
 * Returned by `getItemsOverview()` — intended for Dashboard rendering.
 *
 * @since 0.3.0
 */
export interface PoolItemOverview {
  /** Stringified key (safe for JSON serialization) */
  key: string;
  /** Last access timestamp (ms) */
  lastAccessed: number;
  /** Total access count */
  accessCount: number;
  /** Whether the entry has unflushed modifications */
  isDirty: boolean;
  /** Whether the entry is immune to idle eviction */
  persistent: boolean;
  /** Milliseconds since last access (computed at snapshot time) */
  idleMs: number;
}

/**
 * Full snapshot of pool status for monitoring / Dashboard.
 *
 * @since 0.3.0
 */
export interface PoolStatus {
  // ── Capacity ─────────────────────────────────────────
  /** Current number of items in the pool */
  totalItems: number;
  /** Number of persistent (never-evict) items */
  persistentItems: number;
  /** Number of dirty (unflushed) items */
  dirtyItems: number;
  /** Capacity usage ratio (0.0–1.0), or `null` if `maxSize` is not configured */
  capacityUsage: number | null;

  // ── Performance ──────────────────────────────────────
  /** Cumulative cache hits */
  hits: number;
  /** Cumulative cache misses */
  misses: number;
  /** Hit rate (0.0–1.0), or 0 if no lookups yet */
  hitRate: number;
  /** Cumulative eviction count (idle + watermark) */
  evictions: number;
  /** Cumulative successful flush count */
  flushes: number;
  /** Cumulative flush failure count */
  flushErrors: number;

  // ── Runtime execution state ──────────────────────────
  /** Whether a flush cycle is currently running */
  isFlushing: boolean;
  /** Whether a cleanup/eviction cycle is currently running */
  isCleaning: boolean;
  /** Whether a heartbeat cycle is currently running */
  isHeartbeating: boolean;

  // ── Last-run timestamps (detect timer stalls) ────────
  lastFlushAt: number | null;
  lastCleanupAt: number | null;
  lastHeartbeatAt: number | null;

  // ── Last error ───────────────────────────────────────
  lastError: { time: number; message: string } | null;
}