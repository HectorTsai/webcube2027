// 資料庫 Adapter 統一介面
// 所有 L2/L3 資料庫（SurrealDB、SQLite、MongoDB 等）都實作此介面
// 資料池透過此介面操作，不直接依賴任何特定資料庫

export interface 查詢選項 {
  limit?: number;
  offset?: number;
  includeSeeds?: boolean;
}

/** 依欄位篩選條件 */
export interface 欄位篩選 {
  欄位: string;
  值: string;
}

export interface DatabaseAdapter {
  /** adapter 類型識別，例如 "surrealdb"、"sqlite"、"mongodb" */
  readonly 類型: string;

  /** 根據 ID 查詢單一資料 */
  查詢單一(模型: string, id: string): Promise<Record<string, unknown> | null>;

  /** 查詢模型列表 */
  查詢列表(模型: string, 選項?: 查詢選項): Promise<Record<string, unknown>[]>;

  /** 依欄位查詢（用於非 ID 欄位查詢，如網域） */
  查詢依欄位(模型: string, 篩選: 欄位篩選): Promise<Record<string, unknown>[]>;

  /** 創建新資料，回傳創建後的完整資料 */
  創建(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>>;

  /** 更新既有資料（不存在則創建），回傳完整資料 */
  更新(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>>;

  /** 刪除資料，回傳是否成功 */
  刪除(模型: string, id: string): Promise<boolean>;

  /** 取得指定模型的記錄總數 */
  個數(模型: string): Promise<number>;

  /** 初始化模型（檢查並匯入種子資料，若為空） */
  初始化(模型: string): Promise<void>;
}
