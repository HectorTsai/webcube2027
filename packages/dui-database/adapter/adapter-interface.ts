/** Query options for list operations */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  includeSeeds?: boolean;
}

/** Filter by field/value for querying non-ID columns */
export interface FieldFilter {
  field: string;
  value: string;
}

/**
 * Unified database adapter interface.
 *
 * All L2/L3 databases (SurrealDB, SQLite, MongoDB, MySQL, PostgreSQL,
 * Firestore, Appwrite, DynamoDB, MSSQL) implement this interface.
 * The data pool operates through this abstraction without depending
 * on any specific database driver.
 */
export interface DatabaseAdapter {
  /** Adapter type identifier, e.g. "surrealdb", "sqlite", "mongodb" */
  readonly type: string;

  /**
   * Get a single record by ID.
   * Returns `null` if the record does not exist.
   */
  getById(model: string, id: string): Promise<Record<string, unknown> | null>;

  /**
   * List records for a model with optional pagination.
   */
  list(model: string, options?: QueryOptions): Promise<Record<string, unknown>[]>;

  /**
   * Query records by a specific field/value pair (e.g. domain name lookup).
   */
  queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]>;

  /**
   * Create a new record and return the full saved record.
   */
  create(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Update an existing record (or create if not found). Returns the full saved record.
   */
  update(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Delete a record by ID. Returns `true` on success.
   */
  delete(model: string, id: string): Promise<boolean>;

  /**
   * Partially update specific fields of a record.
   *
   * Unlike `update()` which reads and writes the full record, `patch()` only
   * modifies the specified fields at the database level — no read-modify-write cycle.
   * The `updatedAt` field is automatically updated.
   *
   * Returns the full updated record, or `null` if the record doesn't exist.
   */
  patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null>;

  /**
   * Get the total record count for a model.
   */
  count(model: string): Promise<number>;

  /**
   * Initialize a model table/collection and auto-load seed data if empty.
   */
  initialize(model: string): Promise<void>;
}
