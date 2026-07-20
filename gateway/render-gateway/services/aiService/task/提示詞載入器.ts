// 提示詞載入器 — DB 優先，硬編碼 fallback
// 方案 A：完全取代模式。DB 有且啟用 → 用 DB；否則用 fallback。
// 同一請求內有快取，避免重複查 DB。

import { Context } from 'hono';
import { 資料池 } from '../../../database/資料池.ts';
import type AI提示詞 from '../../../database/models/AI提示詞.ts';

const CACHE_KEY = 'ai_prompt_cache';

/**
 * 載入 AI 提示詞（DB 優先，硬編碼 fallback）
 * 同一請求內自動快取，不重複查 DB。
 * @param c       Hono Context（取自 this.c）
 * @param id      提示詞 ID（如 "AI提示詞:AI提示詞:cube-generator"）
 * @param fallback 硬編碼的備用提示詞
 * @returns 最終使用的提示詞字串
 */
export async function 載入提示詞(c: Context, id: string, fallback: string): Promise<string> {
  let cache = c.get(CACHE_KEY) as Map<string, string> | undefined;
  if (!cache) {
    cache = new Map();
    c.set(CACHE_KEY, cache);
  }
  if (cache.has(id)) return cache.get(id)!;

  try {
    const result = await 資料池.查詢單一<AI提示詞>(id);
    if (result.success && result.data) {
      const prompt = result.data as AI提示詞;
      if (prompt.啟用 && prompt.系統提示?.trim()) {
        cache.set(id, prompt.系統提示);
        return prompt.系統提示;
      }
    }
  } catch {
    // DB 異常 → 降級 fallback
  }
  cache.set(id, fallback);
  return fallback;
}
