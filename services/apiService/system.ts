// deno-lint-ignore-file no-explicit-any
import { 取得KV資料庫 } from '../../core/kv.ts';
import { 回應成功, 回應錯誤, 錯誤回應建構器 } from '../../utils/response.ts';
import { info, error } from '../../utils/logger.ts';

// 取得系統資訊 API
export async function 處理取得系統資訊(c: any) {
  try {
    await info('API', '處理取得系統資訊請求');
    
    const kvDB = 取得KV資料庫();
    const 系統資訊 = await kvDB.取得系統資訊();
    
    if (!系統資訊) {
      return 回應錯誤(c, 錯誤回應建構器.找不到資源('系統資訊不存在'));
    }
    
    return 回應成功(c, 系統資訊, 'default');
    
  } catch (錯誤) {
    await error('API', `取得系統資訊失敗: ${錯誤}`);
    return 回應錯誤(c, 錯誤回應建構器.內部錯誤('取得系統資訊時發生錯誤'));
  }
}

// 更新系統資訊 API
export async function 處理更新系統資訊(c: any) {
  try {
    await info('API', '處理更新系統資訊請求');
    
    const kvDB = 取得KV資料庫();
    const 請求資料 = await c.req.json();
    const 成功 = await kvDB.更新系統資訊(請求資料);
    
    if (!成功) {
      return 回應錯誤(c, 錯誤回應建構器.內部錯誤('更新系統資訊失敗'));
    }
    
    const 更新後資訊 = await kvDB.取得系統資訊();
    return 回應成功(c, 更新後資訊, 'default');
    
  } catch (錯誤) {
    await error('API', `更新系統資訊失敗: ${錯誤}`);
    return 回應錯誤(c, 錯誤回應建構器.請求錯誤('請求格式錯誤或資料無效'));
  }
}

// 取得所有系統設定 API
export async function 處理取得所有系統設定(c: any) {
  try {
    await info('API', '處理取得所有系統設定請求');
    
    const kvDB = 取得KV資料庫();
    const 設定 = await kvDB.取得所有系統設定();
    return 回應成功(c, 設定, 'default');
    
  } catch (錯誤) {
    await error('API', `取得系統設定失敗: ${錯誤}`);
    return 回應錯誤(c, 錯誤回應建構器.內部錯誤('取得系統設定時發生錯誤'));
  }
}
