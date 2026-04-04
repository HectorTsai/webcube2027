// Icon Media 模組 - 處理圖示媒體請求
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';
import { MediaModule, RouteParams } from './index.ts';
import 圖示 from "../../database/models/圖示.ts";
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';

// 從三層資料庫載入圖示
async function 從資料庫載入圖示(c: Context, iconId: string): Promise<Response | null> {
  try {
    // await info('Icon Media', `從三層資料庫載入圖示: ${iconId}`);
    
    // 使用三層查詢管理器直接查詢
    const 查詢結果 = await 三層查詢管理器.查詢單一<圖示>(c, iconId);
    
    if (!查詢結果.success || !查詢結果.data) {
      // await info('Icon Media', `圖示不存在於資料庫: ${iconId}`);
      return null;
    }
    
    const 圖示資料 = 查詢結果.data;
    
    // 處理圖示資料格式
    if (圖示資料.資料 && 圖示資料.資料.format === 'SVG') {
      const 內容 = 圖示資料.資料.content;
      
      // 直接使用 SVG 內容
      if (typeof 內容 === 'string' && 內容.trim().startsWith('<svg')) {
        try {
          const fileContent = new TextEncoder().encode(內容);
          // await info('Icon Media', `使用直接 SVG 內容 (${內容.length} 字符)`);
          
          return new Response(fileContent, {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=31536000',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (encodeError) {
          await error('Icon Media', `SVG 內容編碼失敗: ${encodeError}`);
          return null;
        }
      } else {
        await error('Icon Media', `不支援的內容格式: ${typeof 內容}`);
        return null;
      }
    } else {
      await error('Icon Media', `不支援的圖示資料格式`);
      return null;
    }
    
  } catch (錯誤) {
    await error('Icon Media', `資料庫載入失敗: ${錯誤}`);
    return null;
  }
}

// 從檔案系統載入圖示
async function 從檔案系統載入圖示(iconId: string): Promise<Response | null> {
  try {
    // await info('Icon Media', `從檔案系統載入圖示: ${iconId}`);
    
    // 解析圖示 ID
    const parts = iconId.split(':');
    const mediaId = parts[parts.length - 1];
    
    // 建構檔案路徑
    const filePath = `./icons/${mediaId}`;
    
    // 檢查檔案是否存在
    try {
      const fileInfo = await Deno.stat(filePath);
      if (!fileInfo.isFile) {
        return null;
      }
    } catch {
      return null;
    }
    
    // 讀取檔案
    const fileContent = await Deno.readFile(filePath);
    
    // 取得副檔名
    const extension = mediaId.split('.').pop()?.toLowerCase() || 'png';
    const contentType = 取得ContentType(extension);
    
    // await info('Icon Media', `成功載入檔案: ${filePath} (${fileContent.length} bytes)`);
    
    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (錯誤) {
    await error('Icon Media', `檔案系統載入失敗: ${錯誤}`);
    return null;
  }
}

// 從外部 URL 載入圖示
async function 從外部URL載入圖示(url: string): Promise<Response | null> {
  try {
    // await info('Icon Media', `從外部 URL 載入圖示: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      await error('Icon Media', `外部 URL 請求失敗: ${url} - ${response.status}`);
      return null;
    }
    
    const fileContent = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('Content-Type') || 'image/png';
    
    // await info('Icon Media', `成功從 URL 載入: ${url} (${fileContent.length} bytes)`);
    
    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (錯誤) {
    await error('Icon Media', `外部 URL 載入失敗: ${url} - ${錯誤}`);
    return null;
  }
}

// 根據副檔名取得 Content-Type
function 取得ContentType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'avif': 'image/avif'
  };
  
  return mimeTypes[extension] || 'image/png';
}

// Icon Media 模組
const icon: MediaModule = {
  // GET /media/v1/icon/:id
  GET: async (c: Context, params: RouteParams) => {
    try {
      const iconId = params.id;
      
      if (!iconId) {
        return new Response('Missing icon ID', { 
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // await info('Icon Media', `處理圖示請求: ${iconId}`);
      
      let response: Response | null = null;
      
      // 第一層：檢查是否為外部 URL
      if (iconId.startsWith('http://') || iconId.startsWith('https://')) {
        response = await 從外部URL載入圖示(iconId);
      }
      
      // 第二層：檢查是否為本地檔案
      if (!response && iconId.startsWith('file://')) {
        const localPath = iconId.replace('file://', '');
        if (localPath.startsWith('/icons/')) {
          const fileName = localPath.replace('/icons/', '');
          response = await 從檔案系統載入圖示(fileName);
        }
      }
      
      // 第三層：從資料庫載入
      if (!response) {
        response = await 從資料庫載入圖示(c, iconId);
      }
      
      // 第四層：嘗試檔案系統（直接檔名）
      if (!response) {
        response = await 從檔案系統載入圖示(iconId);
      }
      
      if (!response) {
        await error('Icon Media', `圖示載入失敗: ${iconId}`);
        return new Response('Icon Not Found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      return response;
      
    } catch (錯誤) {
      await error('Icon Media', `圖示請求處理失敗: ${錯誤}`);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

export default icon;
