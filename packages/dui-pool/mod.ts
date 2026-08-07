/**
 * @dui/pool — Universal pool types for WebCube2027
 *
 * Provides a hierarchy of pool classes for different use cases:
 *
 * ```
 * PoolBase (abstract — timers, lifecycle hooks, destroy, reconfigure)
 * ├── BasePool (abstract — LRU Map, get/set/has/delete, dirty flush)
 * │   ├── CachePool (read-through, TTL, prefix invalidation)
 * │   │   └── DataPool (data-gateway proxy + cached CRUD)
 * └── TaskPool (priority queues, concurrency, auto-scaling)
 * ```
 *
 * @module
 */

// ─── PoolBase ────────────────────────────────────────────

export { PoolBase } from './pool-base.ts';

// ─── BasePool ────────────────────────────────────────────

export { BasePool, PoolFullError } from './base-pool.ts';

// ─── CachePool ───────────────────────────────────────────

export { CachePool } from './cache-pool.ts';

// ─── DataPool ────────────────────────────────────────────

export { DataPool } from './data-pool.ts';

// ─── TaskPool ────────────────────────────────────────────

export { TaskPool } from './task-pool.ts';

// ─── Type exports ────────────────────────────────────────

export type {
  PoolBaseOptions,
  PoolOptions,
  PoolItem,
  PoolStatus,
  PoolItemOverview,
  TaskPoolOptions,
  TaskQueueConfig,
  TaskPoolStatus,
} from './types.ts';