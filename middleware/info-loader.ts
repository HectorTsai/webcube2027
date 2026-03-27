// 資訊載入中間件 - 預先載入系統資訊和網站資訊到 context
import { Context, Next } from 'hono';
import { info } from '../utils/logger.ts';
import { 三層查詢管理器 } from '../core/three-tier-query.ts';
import 系統資訊 from '../database/models/系統資訊.ts';
import 網站資訊 from '../database/models/網站資訊.ts';

/**
 * 資訊載入中間件
 * 在每個請求開始時預先載入系統資訊和網站資訊到 context
 * 這樣後續的服務和 API 可以直接從 context 取得，避免重複查詢
 */
export async function 資訊載入器(c: Context, next: Next) {
  // 分別處理系統資訊和網站資訊的載入，避免互相影響
  
  // 1. 載入系統資訊（從 L1）
  try {
    const 系統資訊結果 = await 三層查詢管理器.查詢單一<系統資訊>(
      c, 
      '系統資訊:系統資訊:預設'
    );
    
    if (系統資訊結果.success && 系統資訊結果.data) {
      c.set('系統資訊', 系統資訊結果.data);
      await info('資訊載入器', `系統資訊已載入 (${系統資訊結果.source})`);
    } else {
      c.set('系統資訊', null);
      await info('資訊載入器', '系統資訊不存在');
    }
  } catch (系統錯誤) {
    c.set('系統資訊', null);
    await info('資訊載入器', `載入系統資訊時發生錯誤: ${系統錯誤}`);
  }
  
  // 2. 載入網站資訊（從 L3→L2→L1）
  try {
    const 網站資訊列表 = await 三層查詢管理器.查詢列表<網站資訊>(
      c, 
      '網站資訊', 
      1, 
      0
    );
    
    if (網站資訊列表.success && 網站資訊列表.data && 網站資訊列表.data.length > 0) {
      c.set('網站資訊', 網站資訊列表.data[0]);
      await info('資訊載入器', `網站資訊已載入 (${網站資訊列表.source})`);
    } else {
      c.set('網站資訊', null);
      await info('資訊載入器', '網站資訊不存在');
    }
  } catch (網站錯誤) {
    c.set('網站資訊', null);
    await info('資訊載入器', `載入網站資訊時發生錯誤: ${網站錯誤}`);
  }
  
  await next();
}
