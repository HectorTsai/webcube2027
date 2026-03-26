import { Hono } from 'hono';
import 頁面 from '../../database/models/頁面.ts';
import { info, error } from '../../utils/logger.ts';

const router = new Hono();

// 取得所有頁面
router.get('/', async (c) => {
  try {
    await info('Pages API', '取得所有頁面');
    
    // TODO: 從資料庫查詢所有頁面
    // 目前返回預設資料進行測試
    const pages = [
      {
        id: '頁面:頁面:home',
        路徑: '/',
        標題: { en: 'Home', 'zh-tw': '首頁', vi: 'Trang chủ' },
        方塊: '方塊:方塊:容器',
        內容: { direction: 'column', gap: 'lg' },
        狀態: 'PUBLISHED'
      }
    ];
    
    return c.json({
      成功: true,
      資料: pages,
      來源: '預設值',
      訊息: '頁面 API 正常運作'
    });
  } catch (err) {
    await error('Pages API', `取得頁面失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

// 取得特定頁面
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await info('Pages API', `取得頁面: ${id}`);
    
    // TODO: 從資料庫查詢特定頁面
    // 目前返回預設資料進行測試
    if (id === '頁面:頁面:home') {
      const page = {
        id: '頁面:頁面:home',
        路徑: '/',
        標題: { en: 'Home', 'zh-tw': '首頁', vi: 'Trang chủ' },
        方塊: '方塊:方塊:容器',
        內容: {
          direction: 'column',
          gap: 'lg',
          children: [
            {
              方塊: '方塊:方塊:卡片',
              內容: {
                title: { en: 'Welcome', 'zh-tw': '歡迎', vi: 'Chào mừng' },
                content: { en: 'Hello World', 'zh-tw': '你好世界', vi: 'Xin chào thế giới' }
              }
            }
          ]
        },
        狀態: 'PUBLISHED'
      };
      
      return c.json({
        成功: true,
        資料: page,
        來源: '預設值',
        訊息: '頁面資料取得成功'
      });
    }
    
    return c.json({
      成功: false,
      錯誤: '頁面不存在',
      來源: '錯誤'
    }, 404);
  } catch (err) {
    await error('Pages API', `取得頁面失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

// 建立新頁面
router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    await info('Pages API', '建立新頁面');
    
    // TODO: 儲存到資料庫
    // 目前返回成功響應進行測試
    const newPage = new 頁面(body);
    
    return c.json({
      成功: true,
      資料: newPage.toJSON(),
      來源: '新建',
      訊息: '頁面建立成功'
    }, 201);
  } catch (err) {
    await error('Pages API', `建立頁面失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

// 更新頁面
router.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await info('Pages API', `更新頁面: ${id}`);
    
    // TODO: 更新資料庫中的頁面
    // 目前返回成功響應進行測試
    const updatedPage = new 頁面({ ...body, id });
    
    return c.json({
      成功: true,
      資料: updatedPage.toJSON(),
      來源: '更新',
      訊息: '頁面更新成功'
    });
  } catch (err) {
    await error('Pages API', `更新頁面失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

// 刪除頁面
router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await info('Pages API', `刪除頁面: ${id}`);
    
    // TODO: 從資料庫刪除頁面
    // 目前返回成功響應進行測試
    
    return c.json({
      成功: true,
      資料: { id },
      來源: '刪除',
      訊息: '頁面刪除成功'
    });
  } catch (err) {
    await error('Pages API', `刪除頁面失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

export default router;
