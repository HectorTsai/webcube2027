// Media Service 主要入口點
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';

// Media Service 處理器
export async function 處理Media請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    await info('Media Service', `處理 ${method} ${path}`);
    
    // 移除 /medias 前綴
    const mediaPath = path.replace(/^\/medias/, '');
    
    // 靜態檔案服務
    if (method === 'GET') {
      return await 處理靜態檔案(c, mediaPath);
    }
    
    // 檔案上傳
    if (method === 'POST' && mediaPath === '/upload') {
      return await 處理檔案上傳(c);
    }
    
    // 檔案刪除
    if (method === 'DELETE') {
      return await 處理檔案刪除(c, mediaPath);
    }
    
    // 未支援的方法
    return c.json({
      success: false,
      message: '不支援的 Media 操作',
      error: 'METHOD_NOT_ALLOWED'
    }, 405);
    
  } catch (錯誤) {
    await error('Media Service', `Media 請求處理失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: 'Media 請求處理失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// 處理靜態檔案請求
async function 處理靜態檔案(c: Context, filePath: string): Promise<Response> {
  try {
    // 安全性檢查：防止路徑遍歷攻擊
    if (filePath.includes('..') || filePath.includes('~')) {
      return c.json({
        success: false,
        message: '無效的檔案路徑',
        error: 'INVALID_PATH'
      }, 400);
    }
    
    // 建構實際檔案路徑
    const 實際路徑 = `./medias${filePath}`;
    
    try {
      // 檢查檔案是否存在
      const fileInfo = await Deno.stat(實際路徑);
      
      if (!fileInfo.isFile) {
        return c.json({
          success: false,
          message: '檔案不存在',
          error: 'FILE_NOT_FOUND'
        }, 404);
      }
      
      // 讀取檔案
      const fileContent = await Deno.readFile(實際路徑);
      
      // 根據副檔名設定 Content-Type
      const contentType = 取得ContentType(filePath);
      
      // 設定快取標頭
      const headers = new Headers({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1年快取
        'ETag': `"${fileInfo.mtime?.getTime()}"`,
        'Last-Modified': fileInfo.mtime?.toUTCString() || ''
      });
      
      await info('Media Service', `提供檔案: ${filePath} (${fileContent.length} bytes)`);
      return new Response(fileContent, { headers });
      
    } catch {
      return c.json({
        success: false,
        message: '檔案不存在',
        error: 'FILE_NOT_FOUND'
      }, 404);
    }
    
  } catch (錯誤) {
    await error('Media Service', `靜態檔案處理失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '檔案處理失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// 處理檔案上傳
async function 處理檔案上傳(c: Context): Promise<Response> {
  try {
    // TODO: 實作檔案上傳邏輯
    await info('Media Service', '檔案上傳功能待實作');
    
    return c.json({
      success: false,
      message: '檔案上傳功能尚未實作',
      error: 'NOT_IMPLEMENTED'
    }, 501);
    
  } catch (錯誤) {
    await error('Media Service', `檔案上傳失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '檔案上傳失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// 處理檔案刪除
async function 處理檔案刪除(c: Context, filePath: string): Promise<Response> {
  try {
    // TODO: 實作檔案刪除邏輯
    await info('Media Service', `檔案刪除功能待實作: ${filePath}`);
    
    return c.json({
      success: false,
      message: '檔案刪除功能尚未實作',
      error: 'NOT_IMPLEMENTED'
    }, 501);
    
  } catch (錯誤) {
    await error('Media Service', `檔案刪除失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '檔案刪除失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// 根據副檔名取得 Content-Type
function 取得ContentType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // 圖片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    
    // 文件
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json',
    
    // 音訊
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // 影片
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    
    // 字型
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}
