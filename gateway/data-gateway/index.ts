// database/index.ts — Data layer unified entry (internal use)
//
// This file is kept for compatibility references; package exports go through mod.ts

export type { IdInfo } from './base-model.ts';
export { BaseModel } from './base-model.ts';
export { loadSeeds } from './seed-loader.ts';
export { dataPool } from './pool.ts';
export type { QueryResult } from './pool.ts';
export { registerModel, getModel, listModels, toModelInstance } from './model-registry.ts';

/**
 * L2/L3 database connection configuration.
 *
 * Stored as a JSON string in L1 record (for L2) or
 * L2 record (for L3).
 */
export interface L2ConnectionInfo {
  /** Database type: "surrealdb" | "sqlite" | "mongodb" | "mysql" | "postgresql" | "firestore" | "appwrite" | "dynamodb" | "mssql", default "surrealdb" */
  type: string;
  /** File path for file-based DBs (sqlite) */
  filePath?: string;
  /** Hostname for network DBs */
  host?: string;
  /** Port number */
  port?: number;
  /** Username for authentication */
  username?: string;
  /** Password for authentication */
  password?: string;
  /** Database name (surreal/mongo) or fallback path (sqlite) */
  database?: string;
  /** Namespace (SurrealDB-specific) */
  namespace?: string;
  /** Whether this connection is enabled */
  enabled: boolean;
}
