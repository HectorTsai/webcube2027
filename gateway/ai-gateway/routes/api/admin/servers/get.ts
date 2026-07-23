/**
 * GET /api/admin/servers — 列出所有 AI 伺服器設定
 */

import type { Context } from 'hono';
import { list } from '../../../../services/dataGwClient.ts';

export async function onGet(c: Context) {
  try {
    const servers = await list<Record<string, unknown>>('AI伺服器', undefined, { limit: 100 });
    return c.json({ success: true, data: servers });
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500);
  }
}