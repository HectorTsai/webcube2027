/**
 * AuthProvider 介面 — 可插拔的認證方式
 *
 * 實作此介面即可新增一種登入方式（local、OAuth 等）。
 * 參考 database adapter / AI pool adapter 的 pluggable 模式。
 */

import type { Context } from 'hono';

/** 登入結果 */
export interface AuthResult {
  success: boolean;
  /** 使用者識別資訊（登入成功時） */
  payload?: AuthPayload;
  /** 錯誤訊息（登入失敗時） */
  error?: string;
}

/** JWT payload 中攜帶的使用者資訊 */
export interface AuthPayload {
  sub: string;       // 使用者 ID（如 "使用者:使用者:admin"）
  帳號: string;
  /** 使用者顯示名稱（MultilingualString 序列化），供 UI 顯示，不作為識別碼 */
  名稱?: unknown;
  角色: string[];
  provider: string;  // "local" | "oauth:google" | ...
  權限?: Record<string, unknown>;  // 角色權限設定
  layer?: 'L2' | 'L3';  // 使用者所在資料層
  tenant?: string;       // 登入時的租戶（L3 使用者）
}

/** 認證 Provider 需實作的介面 */
export interface AuthProvider {
  /** 唯一識別名稱，如 "local"、"oauth:google" */
  readonly type: string;

  /**
   * 處理登入請求。
   * 對 local provider 而言，req 包含 { 帳號, 密碼 }。
   * 對 OAuth provider 而言，req 包含 { code } 或類似授權碼。
   *
   * @param tenant 租戶（domain）。由 login API 決定：body 的 `tenant` 欄位 → cookie 訪客 JWT 提取。
   *               自訂登入畫面可直接於 body 帶 `tenant`，無需先取得訪客 JWT。
   */
  login(c: Context, tenant?: string): Promise<AuthResult>;
}
