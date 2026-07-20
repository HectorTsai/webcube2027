import type { TranslationInterface } from '../translation.ts';
import generateGoogleTranslateToken from '../google_token.ts';

type GoogleTranslateResponse = [Array<[string, string, ...unknown[]]>, ...unknown[]];

const GOOGLE_TRANSLATE_BASE_URL = 'https://translate.google.com/translate_a/single';
const GOOGLE_DT_PARAMS = ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'];

async function googleTranslateRequest(
  from: string,
  to: string,
  text: string,
): Promise<string> {
  if (!text) return '';
  if (from === to) return text;

  const token = await generateGoogleTranslateToken(text);
  const params = new URLSearchParams();
  params.set('client', 'gtx');
  params.set('sl', from);
  params.set('tl', to);
  params.set('hl', to);
  for (const dt of GOOGLE_DT_PARAMS) {
    params.append('dt', dt);
  }
  params.set('ie', 'UTF-8');
  params.set('oe', 'UTF-8');
  params.set('otf', '1');
  params.set('ssel', '0');
  params.set('tsel', '0');
  params.set('kc', '7');
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
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    });
  } else {
    response = await fetch(fullUrl);
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

export class GoogleTranslation implements TranslationInterface {
  async translate(
    from: string,
    to: string,
    text: string,
    _host?: string,
  ): Promise<string> {
    try {
      return await googleTranslateRequest(from, to, text);
    } catch (error) {
      console.error(`[GoogleTranslation] 翻譯失敗 ${from} -> ${to}: ${text}`, error);
      return text;
    }
  }
}

export default GoogleTranslation;
