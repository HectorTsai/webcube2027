// Media Service 主要入口點
import { Context } from 'hono';
import { error } from '../../utils/logger.ts';

// Media 模組介面
export interface MediaModule {
  GET?: (c: Context, params: RouteParams) => Promise<Response>;
  POST?: (c: Context, params: RouteParams) => Promise<Response>;
  PUT?: (c: Context, params: RouteParams) => Promise<Response>;
  DELETE?: (c: Context, params: RouteParams) => Promise<Response>;
}

// 路由參數介面
export interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}

/**
 * 處理 Media 請求核心進入點
 */
export async function 處理Media請求(c: Context): Promise<Response> {
  try {
    const path = c.req.path;
    const method = c.req.method;
    
    // 檢查是否為新版 Media v1 路由
    if (path.startsWith('/media/v1/')) {
      return await 處理MediaV1請求(c);
    }
        
    return c.json({
      success: false,
      message: '不支援的 Media 操作',
      error: 'METHOD_NOT_ALLOWED'
    }, 405);
    
  } catch (錯誤) {
    await error('Media Service', `Media 請求處理失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: 'Media 請求處理失敗',
      error: 錯誤 instanceof Error ? 錯誤.message : String(錯誤)
    }, 500);
  }
}

/**
 * 處理 Media V1 子模組路由
 */
async function 處理MediaV1請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    const pathParts = path.replace('/media/v1/', '').split('/');
    const moduleName = pathParts[0]; // 提取 'image' | 'icon' | 'script'
    const resourceId = pathParts.slice(1).join('/'); // 後續所有路徑作為 ID
    
    if (!moduleName) {
      return await 處理Media404(c);
    }
    
    // icon 允許無 resourceId（回傳網站/系統商標），其他模組仍須 ID
    if (!resourceId && moduleName !== 'icon') {
      return await 處理Media404(c);
    }
    
    const routeParams: RouteParams = { id: resourceId || undefined };
    let mediaModule: MediaModule | undefined;
    
    // 動態路由分流映射
    switch (moduleName) {
      case 'image':
        mediaModule = (await import('./image.ts')).default;
        break;
      case 'icon':
        mediaModule = (await import('./icon.ts')).default;
        break;
      case 'script':
        mediaModule = (await import('./script.ts')).default;
        break;
      default:
        return await 處理Media404(c);
    }
    
    let handler: ((c: Context, params: RouteParams) => Promise<Response>) | undefined;
    
    if (method === 'GET' && mediaModule.GET) handler = mediaModule.GET;
    else if (method === 'POST' && mediaModule.POST) handler = mediaModule.POST;
    else if (method === 'PUT' && mediaModule.PUT) handler = mediaModule.PUT;
    else if (method === 'DELETE' && mediaModule.DELETE) handler = mediaModule.DELETE;
    
    if (!handler) {
      return await 處理Media404(c);
    }
    
    return await handler(c, routeParams);
    
  } catch (錯誤) {
    await error('Media v1 Service', `Media v1 請求處理失敗: ${錯誤}`);
    return await 處理Media404(c);
  }
}

/**
 * 處理 Media 404 (修正：改用 Stream 讀取 404 圖片，防止併發 OOM)
 */
async function 處理Media404(c: Context): Promise<Response> {
  try {
    const notFoundPath = './services/mediaService/404.png';
    
    try {
      // Deno 2.x 標準防線：檢查是否存在
      await Deno.stat(notFoundPath);
      const file = await Deno.open(notFoundPath, { read: true });
      
      return new Response(file.readable, {
        status: 404,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    } catch {
      // 萬一連 404 圖片都弄丟了，純文字兜底
      return new Response('Resource Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  } catch (err) {
    await error('Media Service', `404 處理發生異常: ${err}`);
    return new Response('Not Found', { status: 404 });
  }
}