// 翻譯服務 adapter — 注入 @dui/smartmultilingual 的 TranslationInterface
// 讓 MultilingualString.toStringAsync() 走 資料池 快取 + AI 翻譯

import type { TranslationInterface } from '@dui/smartmultilingual';
import { DefaultTranslation } from '@dui/smartmultilingual';
import { 資料池 } from '../../database/資料池.ts';
import { info, error } from '../../utils/logger.ts';

const CACHE_BYTE_LIMIT = 60;

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function isCachable(text: string): boolean {
  return new TextEncoder().encode(text).length <= CACHE_BYTE_LIMIT;
}

function cacheId(sourceLang: string, text: string): string {
  return `單字:單字:${hashText(sourceLang + ':' + text)}`;
}

/**
 * 全域翻譯服務 — 注入 smartmultilingual，取代內建 Google 翻譯
 * Fallback 鏈：資料池快取 → AI 翻譯 (via /api/v1/ai/assist/translate) → Google 翻譯
 */
export class TranslationAdapter implements TranslationInterface {
  private fallback = new DefaultTranslation();

  async translate(from: string, to: string, text: string, host?: string): Promise<string> {
    if (!text) return '';
    if (from === to) return text;

    // 1. 查快取（走資料池 L3→L2→L1）
    if (isCachable(text)) {
      const cached = await this.查快取(from, text, to);
      if (cached) {
        await info('翻譯快取', `[MultilingualString] 快取命中: ${from} → ${to} "${text}"`);
        return cached;
      }
    }

    // 2. AI 翻譯（透過 host 呼叫我們自己的 API）
    if (host) {
      try {
        const aiResult = await this.callAITranslate(host, from, to, text);
        if (aiResult) {
          await info('翻譯快取', `[MultilingualString] AI 翻譯成功: ${from} → ${to} "${text}"`);
          if (isCachable(text)) await this.寫快取(from, text, to, aiResult);
          return aiResult;
        }
      } catch (err) {
        await error('翻譯快取', `[MultilingualString] AI 翻譯失敗，改用 Google: ${err}`);
      }
    }

    // 3. Google 翻譯 fallback
    await info('翻譯快取', `[MultilingualString] Google 翻譯: ${from} → ${to} "${text}"`);
    const translated = await this.fallback.translate(from, to, text, host);
    if (isCachable(text) && translated && translated !== text) {
      await this.寫快取(from, text, to, translated);
    }
    return translated;
  }

  private async callAITranslate(host: string, from: string, to: string, text: string): Promise<string | null> {
    const url = `${host.replace(/\/$/, '')}/api/v1/ai/assist/translate`;
    await info('翻譯快取', `[MultilingualString] 呼叫 AI 翻譯: ${url} "${text.slice(0, 20)}"`);
    const requestBody = { 欄位: { text }, sourceLang: from, targetLangs: [to] };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      await error('翻譯快取', `[MultilingualString] AI 端點回傳 ${response.status}: ${await response.text().catch(() => '')}`);
      return null;
    }

    const data = await response.json() as { success: boolean; data?: Record<string, string> };
    if (data.success && data.data) {
      const translated = Object.values(data.data)[0];
      if (translated) return translated;
    }
    await error('翻譯快取', `[MultilingualString] AI 端點回傳格式不符: ${JSON.stringify(data).slice(0, 200)}`);
    return null;
  }

  private async 查快取(sourceLang: string, text: string, targetLang: string): Promise<string | null> {
    try {
      const id = cacheId(sourceLang, text);
      const result = await 資料池.查詢單一<{ id: string; 資料?: Record<string, unknown> }>(id);
      if (!result.success || !result.data) return null;

      // result.data 是 單字 model 實例，資料欄位為 MultilingualString，需透過 toJSON() 取得純物件
      const raw: Record<string, unknown> = (result.data as unknown as { toJSON(): Record<string, unknown> }).toJSON?.() ?? {};
      const translations = raw.資料 as Record<string, string> | undefined;
      if (!translations) return null;

      // 更新最後讀取時間
      await 資料池.創建或更新('單字', { id, 最後讀取: new Date() });

      return translations[targetLang] ?? null;
    } catch {
      return null;
    }
  }

  private async 寫快取(sourceLang: string, text: string, targetLang: string, translated: string): Promise<void> {
    try {
      const id = cacheId(sourceLang, text);
      const result = await 資料池.查詢單一<{ id: string; 資料?: Record<string, unknown> }>(id);

      const 合併資料: Record<string, string> = {};
      if (result.success && result.data) {
        const raw: Record<string, unknown> = (result.data as unknown as { toJSON(): Record<string, unknown> }).toJSON?.() ?? {};
        const existing = raw.資料 as Record<string, string> | undefined;
        if (existing) {
          for (const [lang, val] of Object.entries(existing)) {
            if (val) 合併資料[lang] = val as string;
          }
        }
      }
      合併資料[sourceLang] = text;
      合併資料[targetLang] = translated;

      await 資料池.創建或更新('單字', {
        id,
        資料: 合併資料,
        最後讀取: new Date(),
      });
    } catch {
      // 快取寫入失敗不影響主流程
    }
  }
}
