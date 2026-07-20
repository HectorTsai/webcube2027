/**
 * Local Auth Provider — 帳號/密碼登入
 *
 * 呼叫 data-gateway 的 InnerAPI 驗證使用者。
 */

import type { Context } from 'hono';
import type { AuthProvider, AuthResult } from './provider.ts';

const DATA_GATEWAY = Deno.env.get('DATA_GATEWAY_URL') || 'http://localhost:8002';

export const localProvider: AuthProvider = {
  type: 'local',

  async login(c: Context): Promise<AuthResult> {
    try {
      const { 帳號, 密碼 } = await c.req.json();
      if (!帳號 || !密碼) {
        return { success: false, error: '請輸入帳號與密碼' };
      }

      const r = await fetch(`${DATA_GATEWAY}/inner-api/auth/verify-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 帳號, 密碼 }),
      });
      const res = await r.json();

      if (!res.success) {
        return { success: false, error: res.error || '帳號或密碼錯誤' };
      }

      return {
        success: true,
        payload: {
          sub: res.data.id,
          帳號: res.data.帳號,
          角色: res.data.角色,
          provider: 'local',
        },
      };
    } catch (err) {
      return { success: false, error: `登入失敗: ${err instanceof Error ? err.message : String(err)}` };
    }
  },
};
