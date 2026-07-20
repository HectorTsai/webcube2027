// POST /api/v1/system/words/clear-expired
// 清除超過 7 天未命中的單字快取（供定時服務或管理後台呼叫）

import { Context } from 'hono';
import type { RouteParams } from '../../index.ts';
import { 資料池 } from '../../../../database/資料池.ts';
import type 單字 from '../../../../database/models/單字.ts';
import { info, error } from '../../../../utils/logger.ts';

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

export default {
  POST: async (c: Context, _params: RouteParams) => {
    const 過期時間 = Date.now() - CACHE_MAX_AGE_MS;
    let 刪除數 = 0;

    try {
      const result = await 資料池.查詢列表<單字>('單字', 10000, 0);
      if (!result.success || !result.data) {
        return c.json({ success: false, message: '查詢單字失敗' }, 500);
      }

      for (const word of result.data) {
        // 忽略不可刪除的單字
        if (word.可刪除 === false) continue;
        if (word.最後讀取.getTime() < 過期時間) {
          const delResult = await 資料池.刪除(word.id);
          if (delResult.success) 刪除數++;
        }
      }

      if (刪除數 > 0) {
        await info('單字API', `clear-expired 完成，刪除 ${刪除數} 個過期單字`);
      }

      return c.json({ success: true, deleted: 刪除數 });

    } catch (err) {
      await error('單字API', `clear-expired 失敗: ${err}`);
      return c.json({ success: false, message: String(err) }, 500);
    }
  },
};
