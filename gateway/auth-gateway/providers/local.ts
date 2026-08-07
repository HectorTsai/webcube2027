/**
 * Local Auth Provider — 帳號/密碼登入
 *
 * 整合 AccountPool：
 *   1. 檢查帳號是否被凍結（5 次失敗 → 凍結 10 分鐘）
 *   2. 快取 hit → 直接 bcrypt 驗證，不用打 data-gateway
 *   3. 快取 miss → 呼叫 pool.verifyPassword 打 data-gateway
 *   4. 成功/失敗 → 更新 pool（失敗計數、pending 登入紀錄、最後登入）
 */

import type { Context } from 'hono';
import type { AuthProvider, AuthResult } from './provider.ts';
import { accountPool } from '../services/account-pool.ts';

export const localProvider: AuthProvider = {
  type: 'local',

  async login(c: Context, tenant?: string): Promise<AuthResult> {
    try {
      const { 帳號, 密碼 } = await c.req.json();
      if (!帳號 || !密碼) {
        return { success: false, error: '請輸入帳號與密碼' };
      }

      // ── 1. 檢查是否被凍結 ──
      if (accountPool.isLocked(帳號, tenant)) {
        return {
          success: false,
          error: '此帳號因多次登入失敗已被暫時凍結，請 10 分鐘後再試',
        };
      }

      const bcrypt = (await import('bcryptjs')) as any;
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || undefined;

      // ── 2. 嘗試 pool 快取 hit（掃描比對 帳號）──
      const cached = accountPool.getUserByAccount(帳號, tenant);
      if (cached) {
        const match = await bcrypt.default.compare(密碼, cached.密碼雜湊);
        if (match) {
          accountPool.recordSuccess(帳號, tenant, cached, ip);
          return {
            success: true,
            payload: {
              sub: cached.id,
              帳號: cached.帳號,
              名稱: cached.名稱,
              角色: cached.角色,
              權限: cached.權限,
              provider: 'local',
              layer: cached._layer as 'L2' | 'L3',
              tenant,
            },
          };
        }
        // 密碼錯誤 → 記錄失敗
        accountPool.recordFailure(帳號, tenant);
        return { success: false, error: '帳號或密碼錯誤' };
      }

      // ── 3. 快取 miss → 呼叫 pool.verifyPassword ──
      const result = await accountPool.verifyPassword(帳號, 密碼, tenant);
      if (!result.success) {
        accountPool.recordFailure(帳號, tenant);
        return { success: false, error: result.error || '帳號或密碼錯誤' };
      }

      // 寫入 pool 快取（含密碼雜湊供後續比對）
      const cachedUser = {
        id: result.data.id as string,
        帳號: result.data.帳號 as string,
        名稱: result.data.名稱,
        角色: result.data.角色 as string[],
        _layer: result.data._layer,
        權限: result.data.權限 as Record<string, unknown>,
        密碼雜湊: result.data.密碼雜湊 as string,
      };
      accountPool.recordSuccess(帳號, tenant, cachedUser, ip);

      return {
        success: true,
        payload: {
          sub: result.data.id,
          帳號: result.data.帳號,
          名稱: result.data.名稱,
          角色: result.data.角色,
          權限: result.data.權限,
          provider: 'local',
          layer: result.data._layer as 'L2' | 'L3',
          tenant,
        },
      };
    } catch (err) {
      return { success: false, error: `登入失敗: ${err instanceof Error ? err.message : String(err)}` };
    }
  },
};