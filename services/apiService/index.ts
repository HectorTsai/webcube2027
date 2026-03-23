// API Service 主要入口點
import { Context } from 'hono';
import { 處理取得系統資訊, 處理更新系統資訊, 處理取得所有系統設定 } from './system.ts';
import { 
  處理取得所有佈景主題, 處理取得單一佈景主題, 處理創建佈景主題, 
  處理更新佈景主題, 處理刪除佈景主題, 處理取得當前主題 
} from './themes.ts';
import { 
  處理取得所有配色, 處理取得單一配色, 處理創建配色, 
  處理更新配色, 處理刪除配色 
} from './colors.ts';
import { 
  處理取得所有骨架, 處理取得單一骨架, 處理創建骨架, 
  處理更新骨架, 處理刪除骨架 
} from './skeletons.ts';
import { 
  處理取得預設佈景主題, 處理取得預設配色, 處理取得預設骨架, 處理取得所有預設值 
} from './defaults.ts';
import { info, error } from '../../utils/logger.ts';

// API 路由處理器
export async function 處理API請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    await info('API Service', `處理 ${method} ${path}`);
    
    // 系統資訊 API
    if (path === '/api/v1/system/info') {
      if (method === 'GET') {
        return await 處理取得系統資訊(c);
      } else if (method === 'PUT') {
        return await 處理更新系統資訊(c);
      }
    }
    
    // 系統設定 API
    if (path === '/api/v1/system/settings' && method === 'GET') {
      return await 處理取得所有系統設定(c);
    }
    
    // 佈景主題 API
    if (path === '/api/v1/themes') {
      if (method === 'GET') return await 處理取得所有佈景主題(c);
      if (method === 'POST') return await 處理創建佈景主題(c);
    }
    if (path.startsWith('/api/v1/themes/')) {
      if (method === 'GET') return await 處理取得單一佈景主題(c);
      if (method === 'PUT') return await 處理更新佈景主題(c);
      if (method === 'DELETE') return await 處理刪除佈景主題(c);
    }
    if (path === '/api/v1/theme' && method === 'GET') {
      return await 處理取得當前主題(c);
    }
    
    // 配色 API
    if (path === '/api/v1/colors') {
      if (method === 'GET') return await 處理取得所有配色(c);
      if (method === 'POST') return await 處理創建配色(c);
    }
    if (path.startsWith('/api/v1/colors/')) {
      if (method === 'GET') return await 處理取得單一配色(c);
      if (method === 'PUT') return await 處理更新配色(c);
      if (method === 'DELETE') return await 處理刪除配色(c);
    }
    
    // 骨架 API
    if (path === '/api/v1/skeletons') {
      if (method === 'GET') return await 處理取得所有骨架(c);
      if (method === 'POST') return await 處理創建骨架(c);
    }
    if (path.startsWith('/api/v1/skeletons/')) {
      if (method === 'GET') return await 處理取得單一骨架(c);
      if (method === 'PUT') return await 處理更新骨架(c);
      if (method === 'DELETE') return await 處理刪除骨架(c);
    }
    
    // 預設值 API - 利用 KV seeds 提供預設值
    if (path === '/api/v1/defaults' && method === 'GET') {
      return await 處理取得所有預設值(c);
    }
    if (path === '/api/v1/defaults/theme' && method === 'GET') {
      return await 處理取得預設佈景主題(c);
    }
    if (path === '/api/v1/defaults/color' && method === 'GET') {
      return await 處理取得預設配色(c);
    }
    if (path === '/api/v1/defaults/skeleton' && method === 'GET') {
      return await 處理取得預設骨架(c);
    }
    
    // 三層查詢測試 API (從 main.ts 移過來)
    if (path === '/api/v1/test/three-tier' && method === 'GET') {
      return await 處理三層查詢測試(c);
    }
    
    // 未找到的 API 路由
    await error('API Service', `未找到 API 路由: ${method} ${path}`);
    return c.json({
      success: false,
      message: 'API 路由不存在',
      error: 'NOT_FOUND'
    }, 404);
    
  } catch (錯誤) {
    await error('API Service', `API 請求處理失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: 'API 請求處理失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// 三層查詢測試處理器 (從 main.ts 移過來)
async function 處理三層查詢測試(c: Context): Promise<Response> {
  const { 三層查詢管理器 } = await import('../../core/three-tier-query.ts');
  const 骨架 = (await import('../../database/models/骨架.ts')).default;
  const 配色 = (await import('../../database/models/配色.ts')).default;
  
  try {
    await info('三層查詢測試', '開始測試三層查詢功能');
    
    const host = c.get('host');
    const tenant = c.get('tenant');
    const l1DB = c.get('kvDB');
    const l2DB = c.get('l2DB');
    const l3DB = c.get('l3DB');
    
    // 測試結果
    const 測試結果 = {
      基本資訊: {
        host,
        tenant,
        可用層級: {
          L1_KV: !!l1DB,
          L2_System: !!l2DB,
          L3_Tenant: !!l3DB
        }
      },
      查詢測試: {} as Record<string, unknown>
    };
    
    // 測試 1: 取得骨架預設值
    const 骨架結果 = await 三層查詢管理器.取得預設值<typeof 骨架.prototype>(c, '骨架');
    測試結果.查詢測試.骨架預設值 = {
      成功: 骨架結果.成功,
      來源: 骨架結果.來源,
      資料: 骨架結果.資料 ? {
        id: 骨架結果.資料.id,
        名稱: 骨架結果.資料.名稱,
        風格: 骨架結果.資料.風格
      } : null,
      錯誤: 骨架結果.錯誤
    };
    
    // 測試 2: 取得配色預設值
    const 配色結果 = await 三層查詢管理器.取得預設值<typeof 配色.prototype>(c, '配色');
    測試結果.查詢測試.配色預設值 = {
      成功: 配色結果.成功,
      來源: 配色結果.來源,
      資料: 配色結果.資料 ? {
        id: 配色結果.資料.id,
        名稱: 配色結果.資料.名稱,
        主色: 配色結果.資料.主色
      } : null,
      錯誤: 配色結果.錯誤
    };
    
    // 測試 3: 查詢骨架列表
    const 骨架列表 = await 三層查詢管理器.查詢列表<typeof 骨架.prototype>(c, '骨架', 5);
    測試結果.查詢測試.骨架列表 = {
      成功: 骨架列表.成功,
      來源: 骨架列表.來源,
      數量: 骨架列表.資料?.length || 0,
      資料: 骨架列表.資料?.map(item => ({
        id: item.id,
        名稱: item.名稱,
        風格: item.風格
      })) || [],
      錯誤: 骨架列表.錯誤
    };
    
    await info('三層查詢測試', '測試完成');
    return c.json({
      success: true,
      message: '三層查詢測試完成',
      data: 測試結果
    });
    
  } catch (錯誤) {
    await error('三層查詢測試', `測試失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '三層查詢測試失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}
