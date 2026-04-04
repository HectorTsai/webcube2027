// 預設值 API 模組 - 處理 /api/v1/defaults/* 路由
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import 佈景主題 from '../../database/models/佈景主題.ts';
import 配色 from '../../database/models/配色.ts';
import 骨架 from '../../database/models/骨架.ts';

// 內部 API 調用輔助函數
import { InnerAPI } from '../../services/index.ts';

// GET - 處理預設值相關的 GET 請求
export async function GET(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // await info('預設值 API', '處理取得預設值請求');
    
    // 從 query string 取得參數
    const type = c.req.query('type');
    const decodedType = type ? decodeURIComponent(type) : undefined;
    
    // 根據 type 決定處理方式
    switch (decodedType) {
      case 'theme':
        return await 處理取得預設佈景主題(c);
      case 'color':
        return await 處理取得預設配色(c);
      case 'skeleton':
        return await 處理取得預設骨架(c);
      default:
        // /api/v1/defaults - 取得所有預設值
        return await 處理取得所有預設值(c);
    }
    
  } catch (錯誤) {
    await error('預設值 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得預設值失敗' }
    }, 500);
  }
}

// 處理取得所有預設值
async function 處理取得所有預設值(c: Context): Promise<Response> {
  try {
    // await info('預設值 API', '開始取得所有預設值');
    
    // 並行取得所有預設值
    const [佈景主題結果, 配色結果, 骨架結果] = await Promise.all([
      三層查詢管理器.取得預設值<佈景主題>(c, '佈景主題'),
      三層查詢管理器.取得預設值<配色>(c, '配色'),
      三層查詢管理器.取得預設值<骨架>(c, '骨架')
    ]);
    
    const 預設值資料 = {
      theme: 佈景主題結果.success && 佈景主題結果.data ? {
        ...佈景主題結果.data.toJSON(),
        isSystemSeed: 佈景主題結果.source === 'L1',
        source: 'L0' // 預設值統一標記為 L0
      } : null,
      color: 配色結果.success && 配色結果.data ? {
        ...配色結果.data.toJSON(),
        isSystemSeed: 配色結果.source === 'L1',
        source: 'L0' // 預設值統一標記為 L0
      } : null,
      skeleton: 骨架結果.success && 骨架結果.data ? {
        ...骨架結果.data.toJSON(),
        isSystemSeed: 骨架結果.source === 'L1',
        source: 'L0' // 預設值統一標記為 L0
      } : null
    };
    
    // await info('預設值 API', '所有預設值取得完成');
    
    return c.json({
      success: true,
      data: 預設值資料,
      source: 'L0' // 預設值統一標記為 L0
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得所有預設值失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得所有預設值失敗' }
    }, 500);
  }
}

// 處理取得預設佈景主題
async function 處理取得預設佈景主題(c: Context): Promise<Response> {
  try {
    // await info('預設值 API', '取得預設佈景主題');
    
    // 直接從三層查詢管理器取得預設值
    const 結果 = await 三層查詢管理器.取得預設值<佈景主題>(c, '佈景主題');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設佈景主題' }
      }, 500);
    }
    
    return c.json({
      success: true,
      data: {
        ...結果.data.toJSON(),
        isDefault: true,
        isSystemSeed: 結果.source === 'L1'
      },
      source: 'L0' // 預設值統一標記為 L0
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得預設佈景主題失敗' }
    }, 500);
  }
}

// 處理取得預設配色
async function 處理取得預設配色(c: Context): Promise<Response> {
  try {
    // await info('預設值 API', '取得預設配色');
    
    // 直接從三層查詢管理器取得預設值
    const 結果 = await 三層查詢管理器.取得預設值<配色>(c, '配色');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設配色' }
      }, 500);
    }
    
    return c.json({
      success: true,
      data: {
        ...結果.data.toJSON(),
        isDefault: true,
        isSystemSeed: 結果.source === 'L1'
      },
      source: 'L0' // 預設值統一標記為 L0
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得預設配色失敗' }
    }, 500);
  }
}

// 處理取得預設骨架
async function 處理取得預設骨架(c: Context): Promise<Response> {
  try {
    // await info('預設值 API', '取得預設骨架');
    
    // 直接從三層查詢管理器取得預設值
    const 結果 = await 三層查詢管理器.取得預設值<骨架>(c, '骨架');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設骨架' }
      }, 500);
    }
    
    return c.json({
      success: true,
      data: {
        ...結果.data.toJSON(),
        isDefault: true,
        isSystemSeed: 結果.source === 'L1'
      },
      source: 'L0' // 預設值統一標記為 L0
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得預設骨架失敗' }
    }, 500);
  }
}

// API 模組匯出
const API: APIModule = {
  GET: GET
};

export default API;
