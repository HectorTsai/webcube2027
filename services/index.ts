// Services 主要進入點

import { Context } from 'hono';
import { error } from '../utils/logger.ts';

/**
 * 自動編碼 URL 參數
 */
function encodeUrlParams(url: string): string {
  const [path, queryString] = url.split('?');
  
  if (!queryString) return url;
  
  return `${path}?${new URLSearchParams(queryString).toString()}`;
}

/**
 * InnerAPI 函數用於內部 API 調用
 * 修正：安全透傳使用者原始 Cookie (如 Token)，並動態追加/覆蓋語系設定
 */
export async function InnerAPI(c: Context, apiPath: string): Promise<Response> {
  try {
    // 自動編碼參數
    const encodedPath = encodeUrlParams(apiPath);
    
    // 處理 Cookie 安全透傳與語系覆蓋
    const 原始Cookie = c.req.header('cookie') || '';
    const 當前語言 = c.get('語言') || 'zh-tw';
    const 語系Cookie字串 = `lang=${當前語言}`;
    
    let 最終Cookie = 原始Cookie;
    if (!原始Cookie) {
      最終Cookie = 語系Cookie字串;
    } else if (!原始Cookie.includes('lang=')) {
      // 如果原本有其他 Cookie 但沒語系，用分號串接追加
      最終Cookie = `${原始Cookie}; ${語系Cookie字串}`;
    } else {
      // 如果原本就有 lang=xx，用正規表達式精準替換成當前語系
      最終Cookie = 原始Cookie.replace(/lang=[^;]+/g, 語系Cookie字串);
    }
    
    const app = c.get('app');
    if (app && typeof app.request === 'function') {
      const response = await app.request(encodedPath, {
        headers: {
          'host': c.req.header('host') || 'localhost:8000',
          'origin': c.req.header('origin') || 'http://localhost:8000',
          'cookie': 最終Cookie
        }
      });
      
      return response;
    } else {
      throw new Error('App 實例在 Context 中不可用，無法執行 InnerAPI');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await error('InnerAPI', `內部API失敗: ${apiPath} - ${errorMessage}`);
    throw err;
  }
}

/**
 * 修正導出語法：將內層的 default class 具名導出
 * 確保外部 import { PageService } from '...' 時能直接拿到類別本身，而非 Module 包裹物件
 */
export { default as PageService } from './pageService/index.ts';
export { default as LanguageService } from './languageService/index.ts';
export * as RendererService from './rendererService/index.ts';
export * as TestService from './testService.ts';