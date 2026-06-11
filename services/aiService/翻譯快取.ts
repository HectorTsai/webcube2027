// 翻譯快取 — 以單字 Model 儲存已翻譯的片語（≤ 60 bytes），避免重複呼叫 AI/Google 翻譯

import { 資料池 } from '../../database/資料池.ts';
import 單字 from '../../database/models/單字.ts';
import { info, error } from '../../utils/logger.ts';

const CACHE_BYTE_LIMIT = 60;
/** 超過此天數未命中的快取將被清理 */
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

/** 以 djb2 hash 產生 cache ID */
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
 * 查詢翻譯快取
 * 僅對 ≤ 60 bytes 的文字啟用，回傳已快取的翻譯結果
 * 若部分目標語言未命中（但有部分命中），仍回傳 null 讓 caller 重新翻譯全部
 */
export async function 查詢翻譯快取(
  sourceLang: string,
  text: string,
  targetLangs: string[],
): Promise<Record<string, string> | null> {
  if (!isCachable(text)) return null;

  const id = cacheId(sourceLang, text);
  const result = await 資料池.查詢單一<單字>(id);

  if (!result.success || !result.data) return null;

  const cached: Record<string, string> = {};
  let allFound = true;
  for (const lang of targetLangs) {
    const val = result.data.資料.getText(lang);
    if (val) {
      cached[lang] = val;
    } else {
      allFound = false;
    }
  }

  if (allFound) {
    await info('翻譯快取', `命中: ${sourceLang} → ${targetLangs.join(',')} "${text}"`);
    // 更新最後讀取時間
    await 資料池.創建或更新('單字', { id, 最後讀取: new Date() });
    return cached;
  }

  return null;
}

/**
 * 寫入翻譯快取
 * 合併現有單字（若有）後寫回
 */
export async function 寫入翻譯快取(
  sourceLang: string,
  text: string,
  translations: Record<string, string>,
): Promise<void> {
  if (!isCachable(text)) return;

  const id = cacheId(sourceLang, text);

  try {
    // 查詢現有單字，合併後寫回
    const existing = await 資料池.查詢單一<單字>(id);

    const 合併資料: Record<string, string> = {};
    if (existing.success && existing.data) {
      for (const [lang, val] of Object.entries(existing.data.資料.toJSON())) {
        if (val) 合併資料[lang] = val;
      }
    }
    合併資料[sourceLang] = text;
    Object.assign(合併資料, translations);

    await 資料池.創建或更新<單字>('單字', {
      id,
      資料: 合併資料,
    } as unknown as Partial<單字>);

    await info('翻譯快取', `寫入: ${sourceLang} → ${Object.keys(translations).join(',')} "${text}"`);
  } catch (err) {
    await error('翻譯快取', `寫入失敗: ${err}`);
  }
}

export { isCachable as isCachableText, isCachable, cacheId, CACHE_BYTE_LIMIT };

/**
 * 清理過期快取 — 刪除 最後讀取 超過 7 天的單字
 * 建議啟動時及定期呼叫
 */
export async function 清理過期快取(): Promise<number> {
  const 過期時間 = new Date(Date.now() - CACHE_MAX_AGE_MS);
  let 刪除數 = 0;

  try {
    const result = await 資料池.查詢列表<單字>('單字', 10000, 0);
    if (!result.success || !result.data) return 0;

    for (const word of result.data) {
      if (word.最後讀取 < 過期時間) {
        const delResult = await 資料池.刪除(word.id);
        if (delResult.success) 刪除數++;
      }
    }

    if (刪除數 > 0) {
      await info('翻譯快取', `清理完成，刪除 ${刪除數} 個過期單字`);
    }
  } catch (err) {
    await error('翻譯快取', `清理過期快取失敗: ${err}`);
  }

  return 刪除數;
}
