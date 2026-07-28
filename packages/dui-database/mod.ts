// @dui/database — Unified data layer for WebCube2027
//
// Provides an adapter-based database abstraction supporting
// SurrealDB, SQLite, MongoDB, MySQL, PostgreSQL, Firestore,
// Appwrite, DynamoDB, and MSSQL.
//
// Architecture:
//   L1 — Config KV store (JSON file) for system settings + encrypted L2 connection info
//   L2 — Central database (SYSTEM)
//   L3 — Per-site database (HOST)

export type { IdInfo } from './base-model.ts';
export { BaseModel } from './base-model.ts';
export { dataPool } from './pool.ts';
export type { QueryResult } from './pool.ts';
export type { DbPoolItemOverview } from './pool.ts';
// Re-export pool status types from @dui/pool v0.3.0 (dataPool.getStatus(), getItemsOverview())
export type { PoolStatus, PoolItemOverview } from '@dui/pool';
// L1Store moved to @dui/kv — re-export for backward compatibility
export { L1Store } from '@dui/kv';
// Re-export crypto utilities from @dui/util
export { encrypt, decrypt, ensureKey, SecretString } from '@dui/util';

export type { L2ConnectionInfo } from './index.ts';