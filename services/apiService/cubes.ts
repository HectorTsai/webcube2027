import { Hono } from 'hono';
import 方塊 from '../../database/models/方塊.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';

const router = new Hono();

// 取得所有方塊
router.get('/', async (c) => {
  try {
    await info('Cubes API', '取得所有方塊');
    
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const 結果 = await 三層查詢管理器.查詢列表<方塊>(c, '方塊', limit, offset);
    
    await info('Cubes API', `取得方塊列表: ${結果.data?.length || 0} 筆 (來源: ${結果.source})`);
    
    // 使用資料過濾器處理列表
    const language = c.get('語言') || 'zh-tw';
    const 簡化資料 = 結果.data ? await 資料過濾器.列表過濾(結果.data, language, 'simple') : [];
    
    return c.json({
      success: 結果.success,
      data: 簡化資料,
      source: 結果.source,
      pagination: {
        limit,
        offset,
        total: 結果.data?.length || 0
      }
    });
    
  } catch (err) {
    await error('Cubes API', `取得所有方塊失敗: ${err.message}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得所有方塊失敗' }
    }, 500);
  }
});

// 取得特定方塊
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await info('Cubes API', `取得方塊: ${id}`);
    
    const 結果 = await 三層查詢管理器.查詢單一<方塊>(c, '方塊', id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '方塊不存在' }
      }, 404);
    }
    
    await info('Cubes API', `取得方塊: ${id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);
    
    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (err) {
    await error('Cubes API', `取得方塊失敗: ${err.message}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得方塊失敗' }
    }, 500);
  }
});

// 建立新方塊
router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    await info('Cubes API', '建立新方塊');
    
    // TODO: 儲存到資料庫
    // 目前返回成功響應進行測試
    const newCube = new 方塊(body);
    
    return c.json({
      成功: true,
      資料: newCube.toJSON(),
      來源: '新建',
      訊息: '方塊建立成功'
    }, 201);
  } catch (err) {
    await error('Cubes API', `建立方塊失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

// 更新方塊
router.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await info('Cubes API', `更新方塊: ${id}`);
    
    // TODO: 更新資料庫中的方塊
    // 目前返回成功響應進行測試
    const updatedCube = new 方塊({ ...body, id });
    
    return c.json({
      成功: true,
      資料: updatedCube.toJSON(),
      來源: '更新',
      訊息: '方塊更新成功'
    });
  } catch (err) {
    await error('Cubes API', `更新方塊失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

// 刪除方塊
router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await info('Cubes API', `刪除方塊: ${id}`);
    
    // TODO: 從資料庫刪除方塊
    // 目前返回成功響應進行測試
    
    return c.json({
      成功: true,
      資料: { id },
      來源: '刪除',
      訊息: '方塊刪除成功'
    });
  } catch (err) {
    await error('Cubes API', `刪除方塊失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

export default router;
