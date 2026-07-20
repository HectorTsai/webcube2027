// 資料池相容層 — 包裝 @dui/database 的 dataPool，提供舊版中文 API
// 讓從 webcube2027 複製過來的 AI 程式碼無需逐行修改

import { dataPool } from "@dui/database";
import type { QueryResult } from "@dui/database";

class 資料池Wrapper {
  /**
   * 查詢列表（L3 → L2 → L1 降級）
   */
  async 查詢列表<T extends { id: string }>(
    model: string,
    limit = 50,
    offset = 0,
  ): Promise<QueryResult<T[]>> {
    return dataPool.list<T>(model, limit, offset);
  }

  /**
   * 合併所有層的查詢結果（去重，高層優先）
   */
  async 查詢所有列表<T extends { id: string }>(
    model: string,
    limit = 50,
    offset = 0,
  ): Promise<QueryResult<T[]>> {
    return dataPool.listAll<T>(model, limit, offset);
  }

  /**
   * 根據 ID 查詢單一記錄
   */
  async 查詢單一<T extends { id: string }>(id: string): Promise<QueryResult<T>> {
    return dataPool.getById<T>(id);
  }

  /**
   * 創建或更新記錄
   */
  async 創建或更新<T extends { id?: string }>(
    model: string,
    data: Partial<T>,
  ): Promise<QueryResult<T>> {
    return dataPool.upsert<T>(model, data);
  }

  /**
   * 刪除記錄（傳入 composite ID 如 "table:type:id"）
   */
  async 刪除(id: string): Promise<QueryResult<boolean>> {
    return dataPool.delete(id);
  }
}

export const 資料池 = new 資料池Wrapper();
