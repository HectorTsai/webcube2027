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
 * Options shared by all pool types (PoolBase).
 *
 * Each subclass interprets these according to its own semantics:
 * - BasePool / CachePool / DataPool: `maxSize` = max cache entries,
 *   `minSize` = warmup target.
 * - TaskPool: `maxSize` = max concurrency, `minSize` = min workers.
 */
export interface PoolBaseOptions {
  /** Cleanup interval (ms). Schedules periodic cleanup() calls. */
  cleanupIntervalMs?: number;
  /** Heartbeat interval (ms). Schedules periodic onHeartbeat() calls. */
  heartbeatIntervalMs?: number;
  /** Hard capacity / concurrency limit. */
  maxSize?: number;
  /** Minimum size / concurrency floor. */
  minSize?: number;
}

/**
 * Options for configuring a BasePool instance.
 *
 * All intervals are optional. Only the timers you set will be started.
 *
 * @since 0.2.0 — added `maxSize`, `highWatermarkRatio`, `minSize` for
 *   watermark protection and capacity management.
 */
export interface PoolOptions extends PoolBaseOptions {
  /** Flush interval (ms). Schedules periodic flushToStorage() for dirty items. */
  flushIntervalMs?: number;
  /** Max idle time (ms). Entries not accessed within this window are evicted. */
  maxIdleMs?: number;

  // ── Capacity management (v0.2.0) ──────────────────────────

  /**
   * Soft watermark ratio (0.0–1.0, default 0.8 = 80%).
   * When pool size exceeds `maxSize × highWatermarkRatio`, background
   * LRU eviction is scheduled via `queueMicrotask` — non-blocking.
   */
  highWatermarkRatio?: number;
}

// ── TaskPool types (v0.4.0) ─────────────────────────────

/**
 * Configuration for a single TaskPool priority queue.
 */
export interface TaskQueueConfig {
  /** Priority level (lower = higher priority). 0 = highest. */
  priority: number;
  /** Optional per-queue concurrency cap. */
  concurrency?: number;
}

/**
 * Options for TaskPool.
 */
export interface TaskPoolOptions extends PoolBaseOptions {
  /** Maximum concurrent workers (required). */
  maxConcurrency: number;
  /** Minimum idle workers. */
  minConcurrency?: number;
  /** Enable auto-scaling based on queue depth vs idle ratio. */
  autoScale?: boolean;
  /** Queue depth ratio to trigger scale-up (0.0–1.0, default 0.8). */
  scaleUpThreshold?: number;
  /** Idle worker ratio to trigger scale-down (0.0–1.0, default 0.3). */
  scaleDownThreshold?: number;
  /** Workers to add/remove per scale cycle (default 2). */
  scaleStep?: number;
  /** Minimum ms between scale events (default 30_000). */
  cooldownMs?: number;
  /** Max pending tasks before backpressure rejection (default 1000). */
  maxQueueSize?: number;
  /** Default queue name (default "default"). */
  defaultQueue?: string;
  /** Queue definitions. Key = queue name. */
  queues?: Record<string, TaskQueueConfig>;
  /** Optional data source (CachePool / DataPool) for tasks to use. */
  dataSource?: { getOrFetch?(key: string, fetcher: () => Promise<unknown>): Promise<unknown | null>; get?(key: string): unknown | null };
}

/**
 * Status snapshot for TaskPool.
 */
export interface TaskPoolStatus {
  // ── Workers ──
  /** Currently active (busy) workers */
  activeWorkers: number;
  /** Target max concurrency */
  maxConcurrency: number;
  /** Target min concurrency */
  minConcurrency: number;
  /** Whether auto-scaling is enabled */
  autoScale: boolean;

  // ── Queue ──
  /** Total pending tasks across all queues */
  pendingTasks: number;
  /** Per-queue breakdown */
  queueDetails: Array<{ name: string; priority: number; pending: number; active: number; concurrency?: number }>;
  /** Queue depth ratio (pending / maxQueueSize), or null if unlimited */
  queuePressure: number | null;
  /** Total completed tasks */
  completedTasks: number;
  /** Total rejected tasks (backpressure) */
  rejectedTasks: number;

  // ── Runtime ──
  /** Whether cleanup/auto-scale cycle is running */
  isCleaning: boolean;
  /** Last cleanup timestamp */
  lastCleanupAt: number | null;
  /** Last error */
  lastError: { time: number; message: string } | null;
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
  /** 與 persistent 同義的別名（供前端語意化命名） */
  isPersistent: boolean;
  /** 閒置踢除閾值（毫秒）；null 代表未設定 → 永不因閒置被踢除 */
  maxIdleMs: number | null;
  /** 距離被閒置踢除的剩餘毫秒數（快照時計算）；null 代表永不因閒置被踢除（∞） */
  remainMs: number | null;
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