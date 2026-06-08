// L3 資料庫 Adapter 統一介面
// 所有 L3 資料庫（SurrealDB、PostgreSQL、SQLite、MongoDB）都實作此介面
// 三層查詢管理器透過此介面操作 L3，不直接依賴任何特定資料庫

export interface 查詢選項 {
  limit?: number;
  offset?: number;
  includeSeeds?: boolean;
}

export interface L3DatabaseAdapter {
  /** adapter 類型識別，例如 "surrealdb"、"postgres"、"sqlite" */
  readonly 類型: string;

  /** 根據 ID 查詢單一資料 */
  查詢單一(模型: string, id: string): Promise<Record<string, unknown> | null>;

  /** 查詢模型列表 */
  查詢列表(模型: string, 選項: 查詢選項): Promise<Record<string, unknown>[]>;

  /** 創建新資料，回傳創建後的完整資料 */
  創建(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>>;

  /** 更新既有資料，回傳更新後的完整資料 */
  更新(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>>;

  /** 刪除資料，回傳是否成功 */
  刪除(模型: string, id: string): Promise<boolean>;

  /** 取得指定模型的記錄總數 */
  個數(模型: string): Promise<number>;

  /** 初始化模型（檢查並匯入種子資料，若為空） */
  初始化(模型: string): Promise<void>;
}
