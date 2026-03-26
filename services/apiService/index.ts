// API Service 主要入口點 - 動態路由架構
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';

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
  id?: string;
  [key: string]: string | undefined;
}

/**
 * 註冊 API 模組路由
 */
export function 註冊API路由(router: any, basePath: string, module: APIModule) {
  // 取得當前/單一資源 (xxx)
  if (module.ONE) {
    router.one(basePath, module.ONE);
  }
  
  // 取得所有資源 (xxxs)
  if (module.GET) {
    router.get(basePath, module.GET);
  }
  
  // 取得指定ID資源 (xxxs/:id)
  if (module.GET) {
    router.get(`${basePath}/:id`, module.GET);
  }
  
  // 創建新資源 (xxxs)
  if (module.POST) {
    router.post(basePath, module.POST);
  }
  
  // 更新資源 (xxxs/:id)
  if (module.PUT) {
    router.put(`${basePath}/:id`, module.PUT);
  }
  
  // 刪除資源 (xxxs/:id)
  if (module.DELETE) {
    router.delete(`${basePath}/:id`, module.DELETE);
  }
}
