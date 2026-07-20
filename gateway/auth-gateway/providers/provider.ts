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
  sub: string;       // 使用者 ID（如 "管理員:管理員:admin"）
  帳號: string;
  角色: string;
  provider: string;  // "local" | "oauth:google" | ...
}

/** 認證 Provider 需實作的介面 */
export interface AuthProvider {
  /** 唯一識別名稱，如 "local"、"oauth:google" */
  readonly type: string;

  /**
   * 處理登入請求。
   * 對 local provider 而言，req 包含 { 帳號, 密碼 }。
   * 對 OAuth provider 而言，req 包含 { code } 或類似授權碼。
   */
  login(c: Context): Promise<AuthResult>;
}
