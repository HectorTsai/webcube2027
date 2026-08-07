/**
 * GET /api/role/:id — 角色資訊 API
 *
 * 透過 accountPool 代理查詢 data-gateway。
 * 名稱依當前語言回傳單一語言文字，轉為 Title Case。
 */

import type { Context } from 'hono';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { accountPool } from '../../../../services/account-pool.ts';

export const GET = async (c: Context) => {
  const roleId = c.req.param('id');
  if (!roleId) {
    return c.json({ success: false, error: '缺少角色 ID' }, 400);
  }

  try {
    const result = await accountPool.request('GET', `/api/l2/${roleId}`);
    if (!result.success || !result.data) {
      return c.json({ success: false, error: '角色不存在' }, 404);
    }

    const role = result.data as Record<string, unknown>;
    const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;

    let displayName = '';
    const nameObj = role.名稱;
    if (nameObj && typeof nameObj === 'object') {
      const ms = new MultilingualString(nameObj as Record<string, string>);
      displayName = await ms.toStringAsync(lang);
      if (displayName) displayName = toTitleCase(displayName);
    }

    return c.json({
      success: true,
      data: {
        id: role.id,
        名稱: displayName,
        權限: role.權限 ?? {},
      },
    });
  } catch (err) {
    return c.json({
      success: false,
      error: `查詢角色失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};