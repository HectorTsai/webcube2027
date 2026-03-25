// API Service 主要入口點 - 動態路由架構
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';

// InnerAPI 函數用於內部 API 調用
export async function InnerAPI(c: Context, apiPath: string): Promise<Response> {
  const app = c.get('app');
  if (app && typeof app.request === 'function') {
    return await app.request(apiPath, {
      headers: {
        'host': c.req.header('host') || 'localhost:8000',
        'origin': c.req.header('origin') || 'http://localhost:8000'
      }
    });
  } else {
    const baseUrl = `http://${c.req.header('host') || 'localhost:8000'}`;
    return await fetch(`${baseUrl}${apiPath}`, {
      headers: {
        'host': c.req.header('host') || 'localhost:8000',
        'origin': c.req.header('origin') || 'http://localhost:8000'
      }
    });
  }
}

// API 模組介面定義
export interface APIModule {
  ONE?: (c: Context, params: RouteParams) => Promise<Response>;  // 取得當前/單一資源 (xxx)
  GET?: (c: Context, params: RouteParams) => Promise<Response>;  // 取得所有資源或指定ID (xxxs, xxxs/:id)
  POST?: (c: Context, params: RouteParams) => Promise<Response>; // 創建新資源 (xxxs)
  PUT?: (c: Context, params: RouteParams) => Promise<Response>;  // 更新資源 (xxxs/:id)
  DELETE?: (c: Context, params: RouteParams) => Promise<Response>; // 刪除資源 (xxxs/:id)
}

// 路由參數介面
export interface RouteParams {
  module: string;
  action?: string;
  id?: string;
  [key: string]: string | undefined;
}

// File Router 概念：直接根據 URL 路徑映射到檔案路徑
function parseAPIPath(path: string): { filePath: string; params: RouteParams } {
  // 移除 /api/v1/ 前綴
  const cleanPath = path.replace(/^\/api\/v1\//, '');
  const segments = cleanPath.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    throw new Error('Invalid API path');
  }
  
  // 直接將路徑轉換為檔案路徑
  // 例如: system/info -> ./system/info.ts
  // 例如: colors -> ./colors.ts
  // 例如: themes/123 -> ./themes.ts (ID: 123)
  
  let filePath = '';
  let module = '';
  let action = '';
  let id = '';
  
  if (segments.length === 1) {
    // /api/v1/colors -> ./colors.ts
    module = segments[0];
    filePath = `./${segments[0]}.ts`;
  } else if (segments.length === 2) {
    // 檢查第二個段落是否為 ID (包含冒號) 或數字
    const secondSegment = segments[1];
    if (secondSegment.includes(':') || /^\d+$/.test(secondSegment)) {
      // /api/v1/colors/123 -> ./colors.ts (ID: 123)
      module = segments[0];
      id = secondSegment;
      filePath = `./${segments[0]}.ts`;
    } else {
      // /api/v1/system/info -> ./system/info.ts
      module = segments[0];
      action = segments[1];
      filePath = `./${segments[0]}/${segments[1]}.ts`;
    }
  } else if (segments.length === 3) {
    // /api/v1/system/info/123 -> ./system/info.ts (ID: 123)
    module = segments[0];
    action = segments[1];
    id = segments[2];
    filePath = `./${segments[0]}/${segments[1]}.ts`;
  }
  
  return {
    filePath,
    params: { module, action, id }
  };
}

// File Router: 直接根據檔案路徑載入模組
async function loadAPIModuleByPath(filePath: string): Promise<APIModule | null> {
  try {
    const module = await import(filePath);
    return module.default || module;
  } catch (err) {
    await error('API Service', `載入模組 ${filePath} 失敗: ${err}`);
    return null;
  }
}

// API 路由處理器 - File Router 概念
export async function 處理API請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method.toUpperCase();
  
  try {
    await info('API Service', `處理 ${method} ${path}`);
    
    // 解析路徑
    let { filePath, params } = parseAPIPath(path);
    await info('API Service', `路由解析結果: filePath=${filePath}, module=${params.module}, action=${params.action}, id=${params.id}`);
    
    // 載入對應的 API 模組
    let apiModule = await loadAPIModuleByPath(filePath);
    let finalParams = params;
    
    // 如果檔案不存在，嘗試其他解析方式
    if (!apiModule) {
      // 1. 如果是單數形式且沒有 action，嘗試對應的複數檔案
      if (!params.module.endsWith('s') && !params.action) {
        const pluralFilePath = `./${params.module}s.ts`;
        apiModule = await loadAPIModuleByPath(pluralFilePath);
        if (apiModule) {
          filePath = pluralFilePath;
          await info('API Service', `單數轉複數: ${params.module} -> ${params.module}s`);
        }
      }
      
      // 2. 如果是複數形式且沒有 action，嘗試當作目錄處理
      if (!apiModule && params.module.endsWith('s') && !params.action) {
        const segments = path.replace(/^\/api\/v1\//, '').split('/').filter(Boolean);
        if (segments.length >= 2) {
          const newFilePath = `./${segments[0]}/${segments[1]}.ts`;
          apiModule = await loadAPIModuleByPath(newFilePath);
          if (apiModule) {
            // 重新解析參數
            finalParams = {
              module: segments[0],
              action: segments[1],
              id: segments[2] || '',
              ...Object.fromEntries(segments.slice(3).map((seg, i) => [`param${i}`, seg]))
            };
            filePath = newFilePath;
            await info('API Service', `複數轉目錄: ${segments[0]} -> ${segments[0]}/${segments[1]}`);
          }
        }
      }
    }
    
    if (!apiModule) {
      return c.json({
        success: false,
        error: {
          code: 'MODULE_NOT_FOUND',
          message: `API 模組檔案 '${filePath}' 不存在`
        }
      }, 404);
    }
    
    // 根據路由模式決定調用哪個方法
    let handler: ((c: Context, params: RouteParams) => Promise<Response>) | undefined;
    
    // 判斷是否以 s 結尾（複數形式）
    const isPlural = finalParams.module.endsWith('s');
    
    if (isPlural) {
      // 複數形式 (colors, skeletons, themes) - 使用新的映射方式
      if (method === 'GET') {
        if (!finalParams.id) {
          // /api/v1/colors -> GET (所有資源)
          handler = apiModule.GET;
        } else {
          // /api/v1/colors/:id -> GET (指定資源)
          handler = apiModule.GET;
        }
      } else {
        // POST, PUT, DELETE 直接對應
        handler = apiModule[method as keyof APIModule];
      }
    } else {
      // 單數形式 (color, skeleton, theme, system/info) - 使用標準 HTTP 方法
      if (method === 'GET' && !finalParams.action && !finalParams.id) {
        // /api/v1/color -> ONE (當前資源)
        handler = apiModule.ONE;
      } else {
        // /api/v1/system/info -> GET, POST, PUT, DELETE
        handler = apiModule[method as keyof APIModule];
      }
    }
    
    if (!handler) {
      const expectedMethod = (method === 'GET' && !isPlural && !finalParams.action && !finalParams.id) ? 'ONE' : method;
      return c.json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `模組 '${filePath}' 不支援 ${expectedMethod} 方法`
        }
      }, 405);
    }
    
    // 設定路由參數到 context
    c.set('apiModule', finalParams.module);
    c.set('apiAction', finalParams.action);
    c.set('apiId', finalParams.id);
    c.set('apiParams', finalParams);
    
    // 調用處理函數
    return await handler(c, finalParams);
    
  } catch (err) {
    await error('API Service', `API 請求處理失敗: ${err}`);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '內部伺服器錯誤'
      }
    }, 500);
  }
}
