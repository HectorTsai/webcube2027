import { Hono } from 'hono';
import 方塊 from '../../database/models/方塊.ts';
import { info, error } from '../../utils/logger.ts';

const router = new Hono();

// 取得所有方塊
router.get('/', async (c) => {
  try {
    await info('Cubes API', '取得所有方塊');
    
    // TODO: 從資料庫查詢所有方塊
    // 目前返回預設資料進行測試
    const cubes = [
      {
        id: '方塊:方塊:容器',
        名稱: { en: 'Container', 'zh-tw': '容器', vi: 'Container' },
        描述: { 
          en: 'Flexible container component for layout',
          'zh-tw': '靈活的容器元件，用於佈局',
          vi: 'Container linh hoạt cho bố cục'
        },
        模式: '內建',
        元件路徑: 'ui/Container',
        屬性定義: {
          children: { type: 'object', required: true },
          direction: { type: 'string', default: 'column' },
          padding: { type: 'string', default: 'md' }
        }
      },
      {
        id: '方塊:方塊:卡片',
        名稱: { en: 'Card', 'zh-tw': '卡片', vi: 'Thẻ' },
        描述: { 
          en: 'Card component for content display',
          'zh-tw': '卡片元件，用於內容顯示',
          vi: 'Thành phần thẻ để hiển thị nội dung'
        },
        模式: '內建',
        元件路徑: 'ui/Card',
        屬性定義: {
          title: { type: 'string', required: false },
          content: { type: 'string', required: false },
          variant: { type: 'string', default: 'default' }
        }
      }
    ];
    
    return c.json({
      成功: true,
      資料: cubes,
      來源: '預設值',
      訊息: '方塊 API 正常運作'
    });
  } catch (err) {
    await error('Cubes API', `取得方塊失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
    }, 500);
  }
});

// 取得特定方塊
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await info('Cubes API', `取得方塊: ${id}`);
    
    // TODO: 從資料庫查詢特定方塊
    // 目前返回預設資料進行測試
    if (id === '方塊:方塊:容器') {
      const cube = {
        id: '方塊:方塊:容器',
        名稱: { en: 'Container', 'zh-tw': '容器', vi: 'Container' },
        描述: { 
          en: 'Flexible container component for layout and grouping',
          'zh-tw': '靈活的容器元件，用於佈局和分組',
          vi: 'Container linh hoạt cho bố cục và nhóm'
        },
        模式: '內建',
        元件路徑: 'ui/Container',
        屬性定義: {
          children: {
            type: 'object',
            description: 'Child elements to render inside the container',
            required: true,
            example: '<div>Content here</div>'
          },
          direction: {
            type: 'string',
            description: 'Flex direction - controls layout orientation',
            required: false,
            default: 'column',
            options: ['row', 'column', 'row-reverse', 'column-reverse'],
            example: 'column'
          },
          align: {
            type: 'string',
            description: 'Cross-axis alignment',
            required: false,
            default: 'stretch',
            options: ['start', 'center', 'end', 'stretch'],
            example: 'center'
          },
          justify: {
            type: 'string',
            description: 'Main-axis alignment',
            required: false,
            default: 'start',
            options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
            example: 'start'
          },
          gap: {
            type: 'string',
            description: 'Spacing between child elements',
            required: false,
            default: 'md',
            options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
            example: 'md'
          },
          padding: {
            type: 'string',
            description: 'Internal spacing of the container',
            required: false,
            default: 'md',
            options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
            example: 'md'
          },
          width: {
            type: 'string',
            description: 'Container width',
            required: false,
            default: 'full',
            options: ['auto', 'full', 'fit', 'screen'],
            example: 'full'
          }
        }
      };
      
      return c.json({
        成功: true,
        資料: cube,
        來源: '預設值',
        訊息: '方塊資料取得成功'
      });
    }
    
    return c.json({
      成功: false,
      錯誤: '方塊不存在',
      來源: '錯誤'
    }, 404);
  } catch (err) {
    await error('Cubes API', `取得方塊失敗: ${err.message}`);
    return c.json({
      成功: false,
      錯誤: err.message,
      來源: '錯誤'
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
