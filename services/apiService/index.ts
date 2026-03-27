// API Service 主要入口點 - 動態路由架構
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';

// API 模組介面
export interface APIModule {
  GET?: (c: Context, params: RouteParams) => Promise<Response>; // 取得資源 (支援 query string 參數)
  POST?: (c: Context, params: RouteParams) => Promise<Response>; // 創建資源
  PUT?: (c: Context, params: RouteParams) => Promise<Response>; // 更新資源 (支援 query string 參數)
  DELETE?: (c: Context, params: RouteParams) => Promise<Response>; // 刪除資源 (支援 query string 參數)
}

// 路由參數介面
export interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}

/**
 * 處理 API 請求 - 新的統一路由分發器
 */
export async function 處理API請求(c: Context): Promise<Response> {
  try {
    await info('API Service', `處理 API 請求: ${c.req.path}`);
    
    const path = c.req.path;
    const method = c.req.method;
    
    // 解析路徑 /api/v1/xxx 或 /api/v1/xxx/yyy
    const pathParts = path.replace('/api/v1/', '').split('/');
    const resourceName = pathParts[0];
    
    // 動態載入模組 - 直接對應檔案路徑
    let apiModule: APIModule | null = null;
    
    try {
      const modulePath = `./${pathParts.join('/')}.ts`;
      const module = await import(modulePath);
      apiModule = module.default;
      
      await info('API Service', `成功載入模組: ${modulePath}`);
    } catch (moduleError) {
      await error('API Service', `載入模組失敗: ${pathParts.join('/')} - ${moduleError}`);
      
      return c.json({
        success: false,
        error: {
          code: 'MODULE_NOT_FOUND',
          message: `API 模組 '${pathParts.join('/')}' 不存在`
        }
      }, 404);
    }
    
    if (!apiModule) {
      return c.json({
        success: false,
        error: {
          code: 'MODULE_NOT_FOUND',
          message: `API 模組 '${pathParts.join('/')}' 不存在`
        }
      }, 404);
    }
    
    // 新的方法映射規則
    let handler: ((c: Context, params: RouteParams) => Promise<Response>) | undefined;
    
    // 所有 HTTP 方法直接對應
    if (method === 'GET' && apiModule.GET) handler = apiModule.GET;
    else if (method === 'POST' && apiModule.POST) handler = apiModule.POST;
    else if (method === 'PUT' && apiModule.PUT) handler = apiModule.PUT;
    else if (method === 'DELETE' && apiModule.DELETE) handler = apiModule.DELETE;
    
    if (!handler) {
      return c.json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `不支援的 HTTP 方法: ${method} ${path}`
        }
      }, 405);
    }
    
    // 執行處理函數（不傳遞路徑參數，所有參數從 query string 取得）
    const response = await handler(c, {});
    await info('API Service', `API 請求成功: ${method} ${path}`);
    
    return response;
    
  } catch (錯誤) {
    await error('API Service', `API 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '內部伺服器錯誤'
      }
    }, 500);
  }
}

/**
 * 註冊 API 模組路由
 */
export function 註冊API路由(router: any, basePath: string, module: APIModule) {
  // GET 方法
  if (module.GET) {
    router.get(basePath, (c: Context) => module.GET!(c, {}));
  }
  
  // POST 方法
  if (module.POST) {
    router.post(basePath, (c: Context) => module.POST!(c, {}));
  }
  
  // PUT 方法
  if (module.PUT) {
    router.put(basePath, (c: Context) => module.PUT!(c, {}));
  }
  
  // DELETE 方法
  if (module.DELETE) {
    router.delete(basePath, (c: Context) => module.DELETE!(c, {}));
  }
}
