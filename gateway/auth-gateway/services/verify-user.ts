/**
 * verifyUser — 驗證使用者帳號密碼
 *
 * 現在只是一個 thin wrapper，所有邏輯已移至 AccountPool.verifyPassword()，
 * 保留此檔案供外部 import 相容。
 */

import { accountPool } from './account-pool.ts';
import type { VerifyUserResult } from './account-pool.ts';

export type { VerifyUserResult };

export async function verifyUser(
  帳號: string,
  密碼: string,
  tenant?: string,
): Promise<VerifyUserResult> {
  return accountPool.verifyPassword(帳號, 密碼, tenant);
}