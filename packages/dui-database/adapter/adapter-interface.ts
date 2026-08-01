/** Query options for list operations */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  /** 欄位篩選：field → value 配對，所有條件 AND 疊加 */
  filter?: Record<string, string>;
  /** 排序欄位名稱（data JSON 中的路徑，如 "updatedAt"、"名稱.zh-tw"） */
  sort?: string;
  /** 排序方向 */
  order?: 'asc' | 'desc';
}

/** Filter by field/value for querying non-ID columns */
export interface FieldFilter {
  field: string;
  value: string;
}

/**
 * Validate an identifier used in raw SQL (table name / field path).
 * Only allows Unicode letters (incl. Chinese), digits, `_`, `-` and `.`.
 * Returns `false` for anything that could break out of a quoted identifier.
 */
export function isSafeIdentifier(name: string): boolean {
  return /^[\p{L}\p{N}\u4e00-\u9fff_\-\.]+$/u.test(name);
}

/** Escape LIKE wildcards (`%` / `_`) inside a pattern prefix. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Normalize a model instance (which may have a `toJSON()` method) into a
 * plain object, and inject `id` + `updatedAt`.
 *
 * Every adapter's `update()` and `create()` should use this helper to
 * ensure consistent serialization and avoid duplicated code.
 */
export function sanitizePayload(data: Record<string, unknown>, id: string): Record<string, unknown> {
  const plain = typeof (data as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
    ? (data as { toJSON: () => Record<string, unknown> }).toJSON()
    : data;
  return { ...plain, id, updatedAt: new Date().toISOString() };
}/**
 * Unified database adapter interface.
 *
 * All L2/L3 databases (SurrealDB, SQLite, MongoDB, MySQL, PostgreSQL,
 * Firestore, Appwrite, DynamoDB, MSSQL) implement this interface.
 * The data pool operates through this abstraction without depending
 * on any specific database driver.
 *
 * Data hierarchy:
 *   Collection (table/collection) → contains multiple model types
 *   Model type → identified by 2nd segment of composite ID (collection:model:nanoid)
 */
export interface DatabaseAdapter {
  /** Adapter type identifier, e.g. "surrealdb", "sqlite", "mongodb" */
  readonly type: string;

  /**
   * Get a single record by composite ID.
   * Returns `null` if the record does not exist.
   */
  getById(id: string): Promise<Record<string, unknown> | null>;

  /**
   * List records from a collection, optionally filtered by model type.
   *
   * @param collection - Collection (table) name
   * @param modelType - Optional: filter by 2nd segment of composite ID
   * @param options - Pagination options
   */
  list(collection: string, modelType?: string, options?: QueryOptions): Promise<Record<string, unknown>[]>;

  /**
   * Query records by a specific field/value pair (e.g. domain name lookup).
   *
   * @param collection - Collection (table) name
   * @param modelType - Optional: filter by 2nd segment of composite ID
   * @param filter - Field name and value to match
   */
  queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]>;

  /**
   * Create a new record and return the full saved record.
   *
   * @param collection - Collection (table) name
   * @param id - Full composite ID (collection:model:nanoid)
   * @param data - Record data
   */
  create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Update an existing record (or create if not found). Returns the full saved record.
   *
   * @param collection - Collection (table) name
   * @param id - Full composite ID (collection:model:nanoid)
   * @param data - Record data
   */
  update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Delete a record by composite ID. Returns `true` on success.
   */
  delete(id: string): Promise<boolean>;

  /**
   * Partially update specific fields of a record without a read-modify-write cycle.
   *
   * @param collection - Collection (table) name
   * @param id - Full composite ID (collection:model:nanoid)
   * @param fields - Fields to update
   *
   * Returns the full updated record, or `null` if the record doesn't exist.
   */
  patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null>;

  /**
   * Get the total record count for a collection, optionally filtered by model type.
   *
   * @param collection - Collection (table) name
   * @param modelType - Optional: filter by 2nd segment of composite ID
   */
  count(collection: string, modelType?: string): Promise<number>;

  /**
   * 輕量連線檢查（heartbeat / testConnection 使用）。
   * 應執行最小代價的查詢（如 SELECT 1 / ping），避免掃描全表或對不存在的表操作。
   *
   * Optional — 未實作的 adapter 由呼叫端以 count() 作為後備。
   */
  ping?(): Promise<boolean>;

  /**
   * Initialize a collection (table/collection).
   */
  initialize(collection: string): Promise<void>;

  /**
   * List all distinct model types within a collection.
   * Parses the 2nd segment of composite IDs.
   *
   * Optional — not all adapters need to implement this.
   */
  listModelTypes?(collection: string): Promise<string[]>;
}
