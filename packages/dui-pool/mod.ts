/**
 * @dui/pool — Generic resource pool base class
 *
 * Provides a reusable BasePool<K, V> with LRU/LFU tracking,
 * dirty-flag write-back, idle eviction, and heartbeat recovery.
 *
 * Usage:
 * ```ts
 * import { BasePool } from '@dui/pool';
 * import type { PoolItem, PoolOptions } from '@dui/pool';
 * ```
 */

export { BasePool } from './base-pool.ts';
export type { PoolItem, PoolOptions } from './types.ts';