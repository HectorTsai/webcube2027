/**
 * GET /api/role/:id — 角色資訊 API
 *
 * 回傳指定角色的基本資料。
 * 名稱依當前語言回傳單一語言文字。
 */

import type { Context } from 'hono';
import { gwFetch } from '@dui/util';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../../utils/config.ts';

export const GET = async (c: Context) => {
  const roleId = c.req.param('id');
  if (!roleId) {
    return c.json({ success: false, error: '缺少角色 ID' }, 400);
  }

  const dataGatewayUrl = await getDataGatewayUrl();
  if (!dataGatewayUrl) {
    return c.json({ success: false, error: 'data-gateway 尚未就緒' }, 502);
  }
  const apiKey = await getDataGatewayApiKey();

  try {
    const res = await gwFetch(c, dataGatewayUrl, `/api/l2/${roleId}`, {
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
    });
    const json = await res.json();

    if (!json.success || !json.data) {
      return c.json({ success: false, error: '角色不存在' }, 404);
    }

    const role = json.data as Record<string, unknown>;
    const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;

    // 名稱：以 MultilingualString 解析目標語言，轉為 Title Case
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