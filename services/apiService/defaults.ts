// 預設值 API 處理器 - 利用 KV seeds 提供預設值
import { Context } from 'hono';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { info, error } from '../../utils/logger.ts';
import 佈景主題 from '../../database/models/佈景主題.ts';
import 配色 from '../../database/models/配色.ts';
import 骨架 from '../../database/models/骨架.ts';

// GET /api/v1/defaults/theme - 取得預設佈景主題
export async function 處理取得預設佈景主題(c: Context): Promise<Response> {
  try {
    const 結果 = await 三層查詢管理器.取得預設值<佈景主題>(c, '佈景主題');
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '無法取得預設佈景主題',
        error: 結果.錯誤 || 'NO_DEFAULT_AVAILABLE'
      }, 404);
    }
    
    await info('預設值 API', `取得預設佈景主題: ${結果.資料.id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: {
        ...結果.資料.toJSON(),
        isDefault: true,
        isSystemSeed: 結果.來源 === 'L1'
      },
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得預設佈景主題失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// GET /api/v1/defaults/color - 取得預設配色
export async function 處理取得預設配色(c: Context): Promise<Response> {
  try {
    const 結果 = await 三層查詢管理器.取得預設值<配色>(c, '配色');
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '無法取得預設配色',
        error: 結果.錯誤 || 'NO_DEFAULT_AVAILABLE'
      }, 404);
    }
    
    await info('預設值 API', `取得預設配色: ${結果.資料.id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: {
        ...結果.資料.toJSON(),
        isDefault: true,
        isSystemSeed: 結果.來源 === 'L1'
      },
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得預設配色失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// GET /api/v1/defaults/skeleton - 取得預設骨架
export async function 處理取得預設骨架(c: Context): Promise<Response> {
  try {
    const 結果 = await 三層查詢管理器.取得預設值<骨架>(c, '骨架');
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '無法取得預設骨架',
        error: 結果.錯誤 || 'NO_DEFAULT_AVAILABLE'
      }, 404);
    }
    
    await info('預設值 API', `取得預設骨架: ${結果.資料.id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: {
        ...結果.資料.toJSON(),
        isDefault: true,
        isSystemSeed: 結果.來源 === 'L1'
      },
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得預設骨架失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// GET /api/v1/defaults - 取得所有預設值
export async function 處理取得所有預設值(c: Context): Promise<Response> {
  try {
    const [主題結果, 配色結果, 骨架結果] = await Promise.all([
      三層查詢管理器.取得預設值<佈景主題>(c, '佈景主題'),
      三層查詢管理器.取得預設值<配色>(c, '配色'),
      三層查詢管理器.取得預設值<骨架>(c, '骨架')
    ]);
    
    const 預設值集合 = {
      theme: 主題結果.成功 ? {
        ...主題結果.資料?.toJSON(),
        source: 主題結果.來源,
        isSystemSeed: 主題結果.來源 === 'L1'
      } : null,
      color: 配色結果.成功 ? {
        ...配色結果.資料?.toJSON(),
        source: 配色結果.來源,
        isSystemSeed: 配色結果.來源 === 'L1'
      } : null,
      skeleton: 骨架結果.成功 ? {
        ...骨架結果.資料?.toJSON(),
        source: 骨架結果.來源,
        isSystemSeed: 骨架結果.來源 === 'L1'
      } : null
    };
    
    await info('預設值 API', '取得所有預設值完成');
    
    return c.json({
      success: true,
      data: 預設值集合,
      meta: {
        availableDefaults: Object.keys(預設值集合).filter(key => 預設值集合[key as keyof typeof 預設值集合] !== null),
        allFromSeeds: 主題結果.來源 === 'L1' && 配色結果.來源 === 'L1' && 骨架結果.來源 === 'L1'
      }
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得所有預設值失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得所有預設值失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}
