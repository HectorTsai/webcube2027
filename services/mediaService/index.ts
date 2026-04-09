// Media Service 主要入口點
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';

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

// Media Service 處理器 - 智能路由機制
export async function 處理Media請求(c: Context): Promise<Response> {
  try {
    const path = c.req.path;
    const method = c.req.method;
    
    // await info('Media Service', `處理 ${method} ${path}`);
    
    // 檢查是否為新版 Media v1 路由
    if (path.startsWith('/media/v1/')) {
      return await 處理MediaV1請求(c);
    }
        
    // 未支援的方法
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
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// 處理 Media v1 請求 - 智能路由機制
async function 處理MediaV1請求(c: Context): Promise<Response> {
  try {
    const path = c.req.path;
    const method = c.req.method;
    
    // await info('Media v1 Service', `處理 ${method} ${path}`);
    
    // 解析路徑 /media/v1/xxx 或 /media/v1/xxx/yyy
    const pathParts = path.replace('/media/v1/', '').split('/');
    const resourceName = pathParts[0];
    
    // 動態載入模組 - 智能回退機制
    let mediaModule: MediaModule | null = null;
    let modulePath: string;
    let routeParams: RouteParams = {};
    
    // 嘗試完整路徑到單一模組的回退
    const fallbackAttempts = [
      { path: pathParts.join('/'), params: {} },                    // ./xxx/yyy/zzz.ts
      { path: pathParts.slice(0, -1).join('/'), params: { id: pathParts[pathParts.length - 1] } }, // ./xxx/yyy.ts + {id: 'zzz'}
      { path: pathParts.slice(0, -2).join('/'), params: { id: pathParts.slice(-2).join('/') } }, // ./xxx.ts + {id: 'yyy/zzz'}
    ];
    
    for (const attempt of fallbackAttempts) {
      if (!attempt.path) continue; // 避免空路徑
      
      try {
        modulePath = `./${attempt.path}.ts`;
        const module = await import(modulePath);
        mediaModule = module.default;
        routeParams = attempt.params;
        
        //await info('Media v1 Service', `成功載入模組: ${modulePath}, 參數: ${JSON.stringify(routeParams)}`);
        break; // 成功載入，跳出迴圈
      } catch (moduleError) {
        // await info('Media v1 Service', `嘗試載入失敗: ${attempt.path} - ${moduleError}`);
        // 繼續下一個嘗試
      }
    }
    if (!mediaModule) {
      await error('Media v1 Service', `所有回退嘗試都失敗: ${pathParts.join('/')}`);
      return await 處理Media404(c);
    }
    
    // 方法映射
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

// 處理 Media 404
async function 處理Media404(c: Context): Promise<Response> {
  try {
    // 嘗試載入 404 圖片
    try {
      const notFoundPath = './services/mediaService/404.png';
      const notFoundData = await Deno.readFile(notFoundPath);
      
      return new Response(notFoundData, {
        status: 404,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache'
        }
      });
    } catch {
      // 如果 404 圖片不存在，回傳文字
      return new Response('Media Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (錯誤) {
    await error('Media Service', `404 處理失敗: ${錯誤}`);
    return new Response('Media Not Found', { status: 404 });
  }
}
