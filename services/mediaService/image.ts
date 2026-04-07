// Image Media 模組 - 處理影像媒體請求
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';
import { MediaModule, RouteParams } from './index.ts';
import 影像 from "../../database/models/影像.ts";
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { ArrayUtils } from '@dui/smartmultilingual';

// 從三層資料庫載入影像
async function 從資料庫載入影像(c: Context, imageId: string): Promise<Response | null> {
  try {
    // 使用三層查詢管理器直接查詢
    const 查詢結果 = await 三層查詢管理器.查詢單一<影像>(c, imageId);
    
    await info('Image Media', `查詢結果: success=${查詢結果.success}, data exists=${!!查詢結果.data}, error=${查詢結果.error}`);
    
    if (!查詢結果.success || !查詢結果.data) {
      return null;
    }
    
    const 影像資料:影像 = 查詢結果.data;
        
    // 處理影像資料格式
    if (影像資料.資料 && 影像資料.資料.format) {
      const 內容 = 影像資料.資料.content;
      const 格式 = 影像資料.資料.format.toLowerCase(); // 轉換為小寫
      
      // 處理 base64 字串（為了 JSON 兼容性）
      if (typeof 內容 === 'string' && !內容.startsWith('file://')) {
        try {
          const bytes = ArrayUtils.fromBase64(內容);
          const contentType = 取得ContentType(格式);
          
          return new Response(bytes as BodyInit, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (decodeError) {
          await error('Image Media', `Base64 解碼失敗: ${decodeError}`);
          return null;
        }
      }
      
      // 處理檔案路徑格式
      if (typeof 內容 === 'string' && 內容.startsWith('file://')) {
        try {
          let filePath = 內容.replace('file://', '');
          
          // 如果是相對路徑，確保從項目根目錄開始
          if (!filePath.startsWith('/') && !filePath.startsWith('./')) {
            filePath = `./${filePath}`;
          }
          
          await info('Image Media', `處理檔案路徑: ${filePath}`);
          
          const fileContent = await Deno.readFile(filePath);
          
          // 從檔案路徑取得副檔名來設定 Content-Type
          const extension = filePath.split('.').pop()?.toLowerCase() || 格式.toLowerCase();
          const contentType = 取得ContentType(extension);
          
          await info('Image Media', `檔案讀取成功: ${filePath} (${fileContent.length} bytes), Content-Type: ${contentType}`);
          
          return new Response(fileContent as BodyInit, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (fileError) {
          await error('Image Media', `檔案讀取失敗: ${fileError}`);
          return null;
        }
      }
      // 處理直接內容格式 (Base64 或二進制)
      else if (typeof 內容 === 'string') {
        try {
          const fileContent = new TextEncoder().encode(內容);
          const extension = 格式.toLowerCase();
          const contentType = 取得ContentType(extension);
          
          // await info('Image Media', `使用直接內容 (${內容.length} 字符)`);
          
          return new Response(fileContent, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (encodeError) {
          await error('Image Media', `內容編碼失敗: ${encodeError}`);
          return null;
        }
      }
      // 處理 Uint8Array 格式
      else if (typeof 內容 === 'object' && 內容 !== null && 'byteLength' in 內容 && 'buffer' in 內容) {
        const extension = 格式.toLowerCase();
        const contentType = 取得ContentType(extension);
        
        // await info('Image Media', `使用二進制內容 (${內容.length} bytes)`);
        
        return new Response(內容 as BodyInit, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        await error('Image Media', `不支援的內容格式: ${typeof 內容}`);
        return null;
      }
    } else {
      await error('Image Media', `不支援的影像資料格式`);
      return null;
    }
    
  } catch (錯誤) {
    await error('Image Media', `資料庫載入失敗: ${錯誤}`);
    return null;
  }
}

// 從檔案系統載入影像
async function 從檔案系統載入影像(imageId: string): Promise<Response | null> {
  try {
    // await info('Image Media', `從檔案系統載入影像: ${imageId}`);
    
    // 解析影像 ID
    const parts = imageId.split(':');
    const mediaId = parts[parts.length - 1];
    
    // 建構檔案路徑
    const filePath = `./images/${mediaId}`;
    
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
    
    // await info('Image Media', `成功載入檔案: ${filePath} (${fileContent.length} bytes)`);
    
    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (錯誤) {
    await error('Image Media', `檔案系統載入失敗: ${錯誤}`);
    return null;
  }
}

// 從外部 URL 載入影像
async function 從外部URL載入影像(url: string): Promise<Response | null> {
  try {
    // await info('Image Media', `從外部 URL 載入影像: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      await error('Image Media', `外部 URL 請求失敗: ${url} - ${response.status}`);
      return null;
    }
    
    const fileContent = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('Content-Type') || 'image/png';
    
    // await info('Image Media', `成功從 URL 載入: ${url} (${fileContent.length} bytes)`);
    
    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (錯誤) {
    await error('Image Media', `外部 URL 載入失敗: ${url} - ${錯誤}`);
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
    'avif': 'image/avif',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff'
  };
  
  return mimeTypes[extension] || 'image/png';
}

// Image Media 模組
const image: MediaModule = {
  // GET /media/v1/image/:id
  GET: async (c: Context, params: RouteParams) => {
    try {
      const imageId = params.id;
      
      if (!imageId) {
        return new Response('Missing image ID', { 
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // await info('Image Media', `處理影像請求: ${imageId}`);
      
      let response: Response | null = null;
      
      // 第一層：檢查是否為外部 URL
      if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
        response = await 從外部URL載入影像(imageId);
      }
      
      // 第二層：檢查是否為本地檔案
      if (!response && imageId.startsWith('file://')) {
        const localPath = imageId.replace('file://', '');
        if (localPath.startsWith('/images/')) {
          const fileName = localPath.replace('/images/', '');
          response = await 從檔案系統載入影像(fileName);
        }
      }
      
      // 第三層：從資料庫載入
      if (!response) {
        response = await 從資料庫載入影像(c, imageId);
      }
      
      // 第四層：嘗試檔案系統（直接檔名）
      if (!response) {
        response = await 從檔案系統載入影像(imageId);
      }
      
      if (!response) {
        await error('Image Media', `影像載入失敗: ${imageId}`);
        return new Response('Image Not Found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      return response;
      
    } catch (錯誤) {
      await error('Image Media', `影像請求處理失敗: ${錯誤}`);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

export default image;
