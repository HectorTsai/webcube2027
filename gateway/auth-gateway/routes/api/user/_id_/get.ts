/**
 * GET /api/user/:id — 使用者資訊 API
 *
 * 回傳指定使用者的資料。依請求者權限過濾欄位。
 * 名稱依當前語言回傳單一語言文字。
 */

import type { Context } from 'hono';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { accountPool } from '../../../../services/account-pool.ts';
import { canViewFullUserData, 公開使用者 } from '../../../../database/models/使用者.ts';

export const GET = async (c: Context) => {
  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ success: false, error: '缺少使用者 ID' }, 400);
  }

  // 判斷請求者權限
  const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
  const isPrivileged = canViewFullUserData(payload, userId);

  // 依 tenant 決定查詢層級
  const tenant = payload?.tenant as string | undefined;

  try {
    const user = await accountPool.getUserById(userId, tenant);
    if (!user) {
      return c.json({ success: false, error: '使用者不存在' }, 404);
    }

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