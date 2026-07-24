/**
 * Local Auth Provider — 帳號/密碼登入
 *
 * 呼叫 data-gateway 的 InnerAPI 驗證使用者。
 *
 * data-gateway URL 從 L1 動態讀取（而非 env var），
 * 確保在 setup 完成後即可使用，不需重啟。
 */

import type { Context } from 'hono';
import type { AuthProvider, AuthResult } from './provider.ts';
import { getL1 } from '../utils/l1.ts';

/** 預設 data-gateway URL（當 L1 尚未設定時） */
const DEFAULT_DATA_GATEWAY = 'http://localhost:8002';

export const localProvider: AuthProvider = {
  type: 'local',

  async login(c: Context): Promise<AuthResult> {
    try {
      const { 帳號, 密碼 } = await c.req.json();
      if (!帳號 || !密碼) {
        return { success: false, error: '請輸入帳號與密碼' };
      }

      // 從 L1 動態讀取 data-gateway URL
      let dataGatewayUrl = DEFAULT_DATA_GATEWAY;
      try {
        const l1 = getL1();
        const stored = await l1.get('data_gateway_url');
        if (stored) dataGatewayUrl = stored;
      } catch {
        // L1 尚未初始化，使用預設值
      }

      const r = await fetch(`${dataGatewayUrl}/inner-api/auth/verify-user`, {
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