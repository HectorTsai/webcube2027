/**
 * Local Auth Provider — 帳號/密碼登入
 *
 * 呼叫 auth-gateway 本地的 `/api/verify-user` 端點驗證使用者。
 *
 * 此端點已從 data-gateway 搬遷至 auth-gateway，
 * 現在 auth-gateway 在本端執行 bcrypt 驗證與權限合併。
 */

import type { Context } from 'hono';
import type { AuthProvider, AuthResult } from './provider.ts';

/** 取得 auth-gateway 自身 URL（用於內部 HTTP 呼叫） */
function getSelfUrl(): string {
  return Deno.env.get('AUTH_GATEWAY_URL') || `http://localhost:${Deno.env.get('AUTH_GATEWAY_PORT') || 8001}`;
}

export const localProvider: AuthProvider = {
  type: 'local',

  async login(c: Context, tenant?: string): Promise<AuthResult> {
    try {
      const { 帳號, 密碼 } = await c.req.json();
      if (!帳號 || !密碼) {
        return { success: false, error: '請輸入帳號與密碼' };
      }

      // ── 呼叫本地 /api/verify-user ──
      // tenant 可為 undefined：L2 使用者（超級管理員）不隸屬租戶，無需 tenant 即可驗證
      const selfUrl = getSelfUrl();
      const r = await fetch(`${selfUrl}/api/verify-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 帳號, 密碼, tenant }),
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
          名稱: res.data.名稱,
          角色: res.data.角色,
          權限: res.data.權限,
          provider: 'local',
        },
      };
    } catch (err) {
      return { success: false, error: `登入失敗: ${err instanceof Error ? err.message : String(err)}` };
    }
  },
};
