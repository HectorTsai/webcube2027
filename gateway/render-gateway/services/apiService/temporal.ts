// temporal API 模組 - 提供日期時間查詢
import { Context } from 'hono';
import { 取得語言 } from '../index.ts';
import { RouteParams } from './index.ts';

// GET - 取得日期時間資訊
// /api/v1/temporal           → 本地化日期字串
// /api/v1/temporal/fullYear  → 年份
// /api/v1/temporal/month     → 月份 (1-12)
// /api/v1/temporal/day       → 日期 (1-31)
// /api/v1/temporal/hours     → 小時 (0-23)
// /api/v1/temporal/minutes   → 分鐘 (0-59)
// /api/v1/temporal/seconds   → 秒數 (0-59)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  const now = Temporal.Now.plainDateTimeISO();

  // 無參數：回傳本地化日期字串
  if (!params.id) {
    const language = await 取得語言(c);
    const locale = language === 'zh-tw' ? 'zh-TW' : language === 'vi' ? 'vi-VN' : 'en-US';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const 本地化日期 = now.toLocaleString(locale, options);

    return c.json({
      success: true,
      data: 本地化日期,
    });
  }

  // 欄位映射
  const fieldMap: Record<string, () => number> = {
    fullYear: () => now.year,
    month: () => now.month,
    day: () => now.day,
    hours: () => now.hour,
    minutes: () => now.minute,
    seconds: () => now.second,
  };

  if (params.id in fieldMap) {
    return c.json({
      success: true,
      data: fieldMap[params.id](),
    });
  }

  return c.json({
    success: false,
    error: { code: 'NOT_FOUND', message: `未知欄位: ${params.id}` },
  }, 404);
}

import { APIModule } from './index.ts';

const API: APIModule = { GET };

export default API;
