// @dui/database — Unified data layer for WebCube2027
//
// Provides an adapter-based database abstraction supporting
// SurrealDB, SQLite, MongoDB, MySQL, PostgreSQL, Firestore,
// Appwrite, DynamoDB, and MSSQL.
//
// Architecture:
//   AdapterPool — pure adapter registry + connection pool
//                 (no L1/L2/L3 concepts — those live in data-gateway)
//   BaseModel   — CRUD abstraction for collections
//   Types       — L2ConnectionInfo, IdInfo, QueryResult
//
// Config store (@dui/util ConfigStore) and layer management
// are handled by gateway-specific services, not this package.

export { AdapterPool, registerAdapter, createAdapter } from './adapter-pool.ts';
export type { AdapterPoolItemOverview } from './adapter-pool.ts';

export type { IdInfo } from './base-model.ts';
export { BaseModel } from './base-model.ts';
export type { BaseModelInterface } from './base-model.ts';


export type { L2ConnectionInfo } from './index.ts';

// Pool types from @dui/pool (re-export)
export type { PoolStatus, PoolItemOverview } from '@dui/pool';

// DatabaseAdapter interface
export type { DatabaseAdapter } from './adapter/adapter-interface.ts';