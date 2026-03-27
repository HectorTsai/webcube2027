// 語言解析中間件
import { Context, Next } from 'hono';
import { info } from '../utils/logger.ts';
import languageService from '../services/languageService/index.ts';

/**
 * 從請求中取得使用者語言
 * 優先順序：
 * 1. URL 路徑中的語言 (/zh-tw, /en, /vi)
 * 2. Cookie 設定的語言
 * 3. 瀏覽器設定的語言 (Accept-Language)
 * 4. 從統一資訊 API 取得支援的語言列表，使用第一個
 */
async function 取得使用者語言(c: Context, checkUrl: boolean = true): Promise<string> {
  // 取得支援的語言列表
  const 支援語言 = await languageService.取得支援語言(c);
  
  // 1. 檢查 URL 路徑中的語言 (優先級最高) - 只有非 API/Media 請求才檢查
  if (checkUrl) {
    const path = c.req.path;
    const pathMatch = path.match(/^\/([a-z]{2}(?:-[a-z]{2})?)\/?$/i);
    if (pathMatch) {
      const pathLang = pathMatch[1].toLowerCase();
      // 驗證路徑語言是否支援
      const 驗證後語言 = await languageService.驗證語言(c, pathLang);
      if (驗證後語言 === pathLang) {
        return pathLang;
      }
    }
  }
  
  // 2. 檢查 Cookie
  const cookieHeader = c.req.header('Cookie');
  const cookieLang = cookieHeader?.match(/lang=([^;]+)/)?.[1];
  if (cookieLang) {
    // 驗證 Cookie 中的語言是否支援
    const 驗證後語言 = await languageService.驗證語言(c, cookieLang);
    if (驗證後語言 === cookieLang) {
      return cookieLang;
    }
  }
  
  // 3. 檢查瀏覽器設定的語言
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
  
  // 4. 使用第一個支援的語言
  if (支援語言.length > 0) {
    return 支援語言[0];
  }
  
  // 5. 最後預設語言
  return 'zh-tw';
}

/**
 * 語言解析中間件
 */
export async function 語言解析器(c: Context, next: Next) {
  // API 和 Media 略過 URL 解析，只用 Cookie & Browser
  const isApiOrMedia = c.req.path.startsWith('/api/') || c.req.path.startsWith('/media/');
  
  const language = await 取得使用者語言(c, !isApiOrMedia); // !isApiOrMedia 表示是否檢查 URL
  
  // 設定語言到 context
  c.set('語言', language);
  
  // 確定語言後寫入 cookie
  c.header('Set-Cookie', `lang=${language}; Path=/; HttpOnly; SameSite=Lax`);
  
  await next();
}
