// @dui/database — Unified data layer for WebCube2027
//
// Provides an adapter-based database abstraction supporting
// SurrealDB, SQLite, MongoDB, MySQL, PostgreSQL, Firestore,
// Appwrite, DynamoDB, and MSSQL.

export type { IdInfo } from './base-model.ts';
export { BaseModel } from './base-model.ts';
export { loadSeeds } from './seed-loader.ts';
export { dataPool } from './pool.ts';
export type { QueryResult } from './pool.ts';
export { registerModel, getModel, listModels, toModelInstance } from './model-registry.ts';
export { default as SecretString } from './secretstring.ts';
export { encrypt, decrypt } from './crypto.ts';
export { info, error, debug, warn, logger } from './logger.ts';
export type { L2ConnectionInfo } from './index.ts';
