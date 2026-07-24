/**
 * POST /api/setup — 首次安裝
 *
 * 接收 data-gateway URL，寫入 L1。
 */

import type { Context } from 'hono';
import { getL1 } from '../../../utils/l1.ts';
import { info, error as logError } from '@dui/util';

export async function POST(c: Context) {
  try {
    const { data_gateway_url } = await c.req.json();

    if (!data_gateway_url || typeof data_gateway_url !== 'string') {
      return c.json({ success: false, error: '請填寫 data-gateway URL' }, 400);
    }

    // 基本 URL 格式驗證
    try {
      new URL(data_gateway_url);
    } catch {
      return c.json({ success: false, error: 'URL 格式不正確' }, 400);
    }

    const l1 = getL1();

    // 檢查是否已安裝（防止重複安裝）
    const existing = await l1.get('data_gateway_url');
    if (existing) {
      return c.json({ success: false, error: 'auth-gateway 已完成安裝。若需重新安裝，請清除 L1 資料。' }, 400);
    }

    // 寫入 L1
    await l1.set('data_gateway_url', data_gateway_url);
    await info('AuthGateway', `data-gateway URL 已設定：${data_gateway_url}`);

    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('AuthGateway', `安裝失敗：${msg}`);
    return c.json({ success: false, error: `安裝失敗：${msg}` }, 500);
  }
}