/**
 * GET /api/user/:id — 使用者資訊 API
 *
 * 回傳指定使用者的資料。依請求者權限過濾欄位：
 *   - 超級管理員／管理員／自己 → 完整資料（含帳號、最後登入）
 *   - 一般使用者 → 僅公開欄位（名稱、圖示、角色）
 * 名稱依當前語言回傳單一語言文字。
 */

import type { Context } from 'hono';
import { gwFetch } from '@dui/util';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../../utils/config.ts';
import { canViewFullUserData, 公開使用者 } from '../../../../database/models/使用者.ts';

export const GET = async (c: Context) => {
  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ success: false, error: '缺少使用者 ID' }, 400);
  }

  const dataGatewayUrl = await getDataGatewayUrl();
  if (!dataGatewayUrl) {
    return c.json({ success: false, error: 'data-gateway 尚未就緒' }, 502);
  }
  const apiKey = await getDataGatewayApiKey();

  // 判斷請求者權限
  const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
  const requesterRoles = (payload?.角色 as string[]) || [];
  const requesterSub = (payload?.sub as string) || '';
  const isPrivileged = canViewFullUserData(requesterRoles, requesterSub, userId);

  try {
    const res = await gwFetch(c, dataGatewayUrl, `/api/l2/${userId}`, {
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
    });
    const json = await res.json();

    if (!json.success || !json.data) {
      return c.json({ success: false, error: '使用者不存在' }, 404);
    }

    const user = json.data as Record<string, unknown>;
    const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;

    // 名稱：以 MultilingualString 解析目標語言，轉為 Title Case
    const nameObj = user.名稱;
    let displayName: string;
    if (nameObj && typeof nameObj === 'object') {
      const ms = new MultilingualString(nameObj as Record<string, string>);
      displayName = await ms.toStringAsync(lang);
      if (displayName) displayName = toTitleCase(displayName);
    } else {
      displayName = (user.帳號 as string) || '';
    }

    if (isPrivileged) {
      return c.json({
        success: true,
        data: {
          id: user.id,
          帳號: user.帳號,
          名稱: displayName,
          角色: user.角色 ?? [],
          圖示: user.圖示,
          最後登入: user.最後登入,
        },
      });
    }

    // 非特權：僅回傳公開欄位
    const pub = new 公開使用者(user as any);
    const pubJson = pub.toJSON();
    pubJson.名稱 = displayName;
    return c.json({ success: true, data: pubJson });
  } catch (err) {
    return c.json({
      success: false,
      error: `查詢使用者失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};