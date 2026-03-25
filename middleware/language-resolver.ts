// 語言解析中間件
import { Context, Next } from 'hono';
import { info } from '../utils/logger.ts';
import languageService from '../services/languageService/index.ts';

/**
 * 從請求中取得使用者語言
 * 優先順序：
 * 1. Cookie 設定的語言
 * 2. 瀏覽器設定的語言 (Accept-Language)
 * 3. 從統一資訊 API 取得支援的語言列表，使用第一個
 */
async function 取得使用者語言(c: Context): Promise<string> {
  // 取得支援的語言列表
  const 支援語言 = await languageService.取得支援語言(c);
  
  // 1. 檢查 Cookie
  const cookieLang = c.req.header('Cookie')?.match(/lang=([^;]+)/)?.[1];
  if (cookieLang) {
    // 驗證 Cookie 中的語言是否支援
    const 驗證後語言 = await languageService.驗證語言(c, cookieLang);
    if (驗證後語言 === cookieLang) {
      return cookieLang;
    }
  }
  
  // 2. 檢查瀏覽器設定的語言
  const acceptLang = c.req.header('Accept-Language');
  if (acceptLang) {
    // 解析 Accept-Language 標頭，例如：zh-TW,zh;q=0.9,en;q=0.8
    const languages = acceptLang.split(',').map(lang => {
      const [code, quality] = lang.trim().split(';');
      const q = quality ? parseFloat(quality.split('=')[1]) : 1;
      return { code: code.toLowerCase(), q };
    }).sort((a, b) => b.q - a.q);
    
    // 尋找支援的語言
    for (const lang of languages) {
      const normalizedCode = lang.code.replace('-', '').toLowerCase();
      for (const supported of 支援語言) {
        if (supported.replace('-', '').toLowerCase() === normalizedCode) {
          // 驗證語言是否支援
          const 驗證後語言 = await languageService.驗證語言(c, supported);
          if (驗證後語言 === supported) {
            return supported;
          }
        }
      }
    }
  }
  
  // 3. 使用第一個支援的語言
  if (支援語言.length > 0) {
    return 支援語言[0];
  }
  
  // 4. 最後預設語言
  return 'zh-tw';
}

/**
 * 語言解析中間件
 */
export async function 語言解析器(c: Context, next: Next) {
  const language = await 取得使用者語言(c);
  
  // 設定語言到 context
  c.set('語言', language);
  
  await info('語言解析器', `設定語言: ${language}`);
  
  await next();
}
