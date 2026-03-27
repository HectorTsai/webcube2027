// Services 主要入口點
import { Context } from 'hono';
import { info, error } from '../utils/logger.ts';

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
 * 統一所有 Service 的內部 API 呼叫邏輯，自動編碼參數
 */
export async function InnerAPI(c: Context, apiPath: string): Promise<Response> {
  try {
    // 自動編碼參數
    const encodedPath = encodeUrlParams(apiPath);
    
    const app = c.get('app');
    if (app && typeof app.request === 'function') {
      const response = await app.request(encodedPath, {
        headers: {
          'host': c.req.header('host') || 'localhost:8000',
          'origin': c.req.header('origin') || 'http://localhost:8000',
          'cookie': `lang=${c.get('語言') || 'zh-tw'}; Path=/; HttpOnly; SameSite=Lax`
        }
      });
      
      return response;
    } else {
      throw new Error('App instance not available for InnerAPI');
    }
  } catch (err) {
    await error('InnerAPI', `內部API失敗: ${apiPath} - ${err.message}`);
    throw err;
  }
}

/**
 * 導出所有 Service
 */
export * as PageService from './pageService/index.ts';
export * as RendererService from './rendererService/index.ts';
export * as LanguageService from './languageService/index.ts';
