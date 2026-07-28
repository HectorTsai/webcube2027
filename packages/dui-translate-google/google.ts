/**
 * Google Translation Provider
 *
 * Uses the public Google Translate API (no API key required).
 * Extracted from dui-multilanguage as a standalone package.
 */

import generateGoogleTranslateToken from './google_token.ts';

// ── Types ──

export interface TranslationProvider {
  /** Translate text to the target language. */
  translate(text: string, targetLang: string, sourceLang?: string): Promise<string>;
}

// ── Implementation ──

type GoogleTranslateResponse = [Array<[string, string, ...unknown[]]>, ...unknown[]];

const GOOGLE_TRANSLATE_BASE_URL = 'https://translate.google.com/translate_a/single';

// 預先串好固定 query parameters，避免每次請求重複 append
const BASE_PARAMS = 'client=gtx&ie=UTF-8&oe=UTF-8&otf=1&ssel=0&tsel=0&kc=7&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function googleTranslateRequest(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<string> {
  if (!text) return '';
  const from = sourceLang || 'auto';
  if (from === targetLang) return text;

  const token = await generateGoogleTranslateToken(text);

  // 以預編好的 BASE_PARAMS 初始化，只覆蓋變動的參數
  const params = new URLSearchParams(BASE_PARAMS);
  params.set('sl', from);
  params.set('tl', targetLang);
  params.set('hl', targetLang);
  params.set('q', text);
  params.set(token.name, token.value);

  const fullUrl = `${GOOGLE_TRANSLATE_BASE_URL}?${params.toString()}`;

  let response: Response;
  if (fullUrl.length > 2048) {
    const body = new URLSearchParams({ q: text });
    params.delete('q');
    const postUrl = `${GOOGLE_TRANSLATE_BASE_URL}?${params.toString()}`;
    response = await fetch(postUrl, {
      method: 'POST',
      body: body.toString(),
      headers: {
        ...DEFAULT_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    });
  } else {
    response = await fetch(fullUrl, {
      headers: DEFAULT_HEADERS,
    });
  }

  if (!response.ok) {
    throw new Error(`Google Translate 請求失敗: ${response.status}`);
  }

  const body = await response.json() as GoogleTranslateResponse;
  if (!Array.isArray(body) || !Array.isArray(body[0])) {
    throw new Error('Google Translate 回應格式不正確');
  }

  let translated = '';
  for (const segment of body[0]) {
    if (Array.isArray(segment) && typeof segment[0] === 'string') {
      translated += segment[0];
    }
  }

  return translated || text;
}

export class GoogleTranslationProvider implements TranslationProvider {
  async translate(
    text: string,
    targetLang: string,
    sourceLang?: string,
  ): Promise<string> {
    try {
      return await googleTranslateRequest(text, targetLang, sourceLang);
    } catch (error) {
      console.error(
        `[GoogleTranslationProvider] 翻譯失敗 ${sourceLang ?? 'auto'} -> ${targetLang}: ${text}`,
        error,
      );
      return text; // fallback: return original
    }
  }
}

export default GoogleTranslationProvider;