// 預設值 API 模組 - 處理 /api/v1/defaults/* 路由
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import 佈景主題 from '../../database/models/佈景主題.ts';
import 配色 from '../../database/models/配色.ts';
import 骨架 from '../../database/models/骨架.ts';

// 內部 API 調用輔助函數
async function InnerAPI(c: Context, path: string): Promise<Response> {
  const app = c.get('app');
  return await app.request(path);
}

// GET - 處理預設值相關的 GET 請求
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    // 根據 action 決定處理方式
    switch (params.action) {
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
    
  } catch (err) {
    await error('預設值 API', `GET 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得預設值失敗' }
    }, 500);
  }
}

// 處理取得所有預設值
async function 處理取得所有預設值(c: Context): Promise<Response> {
  try {
    await info('預設值 API', '開始取得所有預設值');
    
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
        source: 佈景主題結果.source
      } : null,
      color: 配色結果.success && 配色結果.data ? {
        ...配色結果.data.toJSON(),
        isSystemSeed: 配色結果.source === 'L1',
        source: 配色結果.source
      } : null,
      skeleton: 骨架結果.success && 骨架結果.data ? {
        ...骨架結果.data.toJSON(),
        isSystemSeed: 骨架結果.source === 'L1',
        source: 骨架結果.source
      } : null
    };
    
    await info('預設值 API', '所有預設值取得完成');
    
    return c.json({
      success: true,
      data: 預設值資料,
      source: 'mixed'
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
    await info('預設值 API', '取得預設佈景主題');
    
    // 優先順序：資訊 -> L3 -> L2 -> L1
    // 1. 先嘗試從資訊取得當前設定的佈景主題
    try {
      const 資訊回應 = await InnerAPI(c, '/api/v1/info');
      const 資訊 = await 資訊回應.json();
      
      if (資訊.success && 資訊.data?.佈景主題) {
        const 佈景主題回應 = await InnerAPI(c, `/api/v1/themes/${資訊.data.佈景主題}`);
        const 佈景主題結果 = await 佈景主題回應.json();
        
        if (佈景主題結果.success) {
          return c.json({
            success: true,
            data: {
              ...佈景主題結果.data,
              isDefault: true,
              isSystemSeed: false
            },
            source: 'system_config'
          });
        }
      }
    } catch (錯誤) {
      await info('預設值 API', `從資訊取得佈景主題失敗，回退到預設值: ${錯誤}`);
    }
    
    // 2. 回退到三層查詢的預設值
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
      source: 結果.source
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
    await info('預設值 API', '取得預設配色');
    
    // 優先順序：資訊 -> 佈景主題 -> L3 -> L2 -> L1
    // 1. 先嘗試從資訊取得當前設定的配色
    try {
      const 資訊回應 = await InnerAPI(c, '/api/v1/info');
      const 資訊 = await 資訊回應.json();
      
      if (資訊.success && 資訊.data) {
        // 直接配色設定
        if (資訊.data.配色) {
          const 配色回應 = await InnerAPI(c, `/api/v1/colors/${資訊.data.配色}`);
          const 配色結果 = await 配色回應.json();
          
          if (配色結果.success) {
            return c.json({
              success: true,
              data: {
                ...配色結果.data,
                isDefault: true,
                isSystemSeed: false
              },
              source: 'system_config'
            });
          }
        }
        
        // 從佈景主題取得配色
        if (資訊.data.佈景主題) {
          const 佈景主題回應 = await InnerAPI(c, `/api/v1/themes/${資訊.data.佈景主題}`);
          const 佈景主題結果 = await 佈景主題回應.json();
          
          if (佈景主題結果.success && 佈景主題結果.data.配色) {
            const 配色回應 = await InnerAPI(c, `/api/v1/colors/${佈景主題結果.data.配色}`);
            const 配色結果 = await 配色回應.json();
            
            if (配色結果.success) {
              return c.json({
                success: true,
                data: {
                  ...配色結果.data,
                  isDefault: true,
                  isSystemSeed: false
                },
                source: 'theme_config'
              });
            }
          }
        }
      }
    } catch (錯誤) {
      await info('預設值 API', `從資訊取得配色失敗，回退到預設值: ${錯誤}`);
    }
    
    // 2. 回退到三層查詢的預設值
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
      source: 結果.source
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
    await info('預設值 API', '取得預設骨架');
    
    // 優先順序：資訊 -> 佈景主題 -> L3 -> L2 -> L1
    // 1. 先嘗試從資訊取得當前設定的骨架
    try {
      const 資訊回應 = await InnerAPI(c, '/api/v1/info');
      const 資訊 = await 資訊回應.json();
      
      if (資訊.success && 資訊.data) {
        // 直接骨架設定
        if (資訊.data.骨架) {
          const 骨架回應 = await InnerAPI(c, `/api/v1/skeletons/${資訊.data.骨架}`);
          const 骨架結果 = await 骨架回應.json();
          
          if (骨架結果.success) {
            return c.json({
              success: true,
              data: {
                ...骨架結果.data,
                isDefault: true,
                isSystemSeed: false
              },
              source: 'system_config'
            });
          }
        }
        
        // 從佈景主題取得骨架
        if (資訊.data.佈景主題) {
          const 佈景主題回應 = await InnerAPI(c, `/api/v1/themes/${資訊.data.佈景主題}`);
          const 佈景主題結果 = await 佈景主題回應.json();
          
          if (佈景主題結果.success && 佈景主題結果.data.骨架) {
            const 骨架回應 = await InnerAPI(c, `/api/v1/skeletons/${佈景主題結果.data.骨架}`);
            const 骨架結果 = await 骨架回應.json();
            
            if (骨架結果.success) {
              return c.json({
                success: true,
                data: {
                  ...骨架結果.data,
                  isDefault: true,
                  isSystemSeed: false
                },
                source: 'theme_config'
              });
            }
          }
        }
      }
    } catch (錯誤) {
      await info('預設值 API', `從資訊取得骨架失敗，回退到預設值: ${錯誤}`);
    }
    
    // 2. 回退到三層查詢的預設值
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
      source: 結果.source
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
