/**
 * POST /api/register — 註冊帳號
 *
 * 透過 accountPool 代理建立使用者。
 * pool 內部決定是否快取（新使用者建立成功後會寫入快取）。
 */

import type { Context } from 'hono';
import { accountPool } from '../../../services/account-pool.ts';

export const POST = async (c: Context) => {
  const tenant = c.get('tenant') as string | undefined;
  const layer = tenant ? 'l3' : 'l2';

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: '請求資料格式錯誤' }, 400);
  }

  if (!body.帳號 || !body.密碼) {
    return c.json({ success: false, error: '帳號與密碼為必填欄位' }, 400);
  }

  try {
    const result = await accountPool.createUser(layer, tenant, body);
    if (!result.success) {
      return c.json({ success: false, error: result.error || '註冊失敗' }, 502);
    }
    return c.json({ success: true, data: result.data });
  } catch (err) {
    return c.json({
      success: false,
      error: `註冊失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};