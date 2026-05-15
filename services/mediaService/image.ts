// Image Media 模組 - 處理 影像 媒體 請求
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';
import { MediaModule, RouteParams } from './index.ts';
import 影像 from "../../database/models/影像.ts";
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { ArrayUtils } from '@dui/smartmultilingual';

/**
 * 從三層資料庫載入影像
 * 採用解法 B：使用 as any 繞過 Deno 的 Uint8Array<ArrayBufferLike> 型別相容性檢查，保持零記憶體額外損耗
 */
async function 從資料庫載入影像(c: Context, imageId: string): Promise<Response | null> {
  try {
    const 查詢結果 = await 三層查詢管理器.查詢單一<影像>(c, imageId);
    
    if (!查詢結果.success || !查詢結果.data) {
      return null;
    }
    
    const 影像資料: 影像 = 查詢結果.data;
        
    if (影像資料.資料 && 影像資料.資料.format) {
      const 內容 = 影像資料.資料.content;
      const 格式 = 影像資料.資料.format.toLowerCase();
      
      if (typeof 內容 === 'string' && !內容.startsWith('file://')) {
        try {
          // 取得的 bytes 型別為 Uint8Array<ArrayBufferLike>
          const bytes = ArrayUtils.fromBase64(內容);
          const contentType = 格式 === 'png' ? 'image/png' : 格式 === 'gif' ? 'image/gif' : 'image/jpeg';
          
          // 💡 解法 B 核心點：直接使用 bytes as any 塞入 Response，完全消除 deno-ts(2345) 錯誤
          return new Response(bytes as any, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              // 加入持久化強快取（1 年），提升高併發網頁加載效能
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        } catch (解碼錯誤) {
          await error('Image Media', `Base64 解碼失敗: ${解碼錯誤}`);
          return null;
        }
      }
    }
    return null;
  } catch (err) {
    await error('Image Media', `資料庫讀取影像異常: ${err}`);
    return null;
  }
}

/**
 * 從檔案系統載入影像
 * 優化：全面採用 Deno.open 串流 readable 載入，防範高併發爆 RAM
 */
async function 從檔案系統載入影像(fileName: string): Promise<Response | null> {
  try {
    // 安全防線：過濾路徑探測符，防範 Path Traversal 攻擊
    if (fileName.includes('..')) return null;

    const localPath = `./public/images/${fileName}`;
    try {
      await Deno.stat(localPath);
      
      // 使用 Deno 2.x 的串流模式讀取檔案
      const file = await Deno.open(localPath, { read: true });
      
      // 自動判定 Content-Type
      let contentType = 'image/jpeg';
      if (fileName.endsWith('.png')) contentType = 'image/png';
      else if (fileName.endsWith('.gif')) contentType = 'image/gif';
      else if (fileName.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (fileName.endsWith('.webp')) contentType = 'image/webp';
      
      return new Response(file.readable, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400' // 本地靜態檔案快取 1 天
        }
      });
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * 從外部 URL 載入影像
 */
async function 從外部URL載入影像(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    
    // 透傳 Response body 串流，保持高效能
    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch {
    return null;
  }
}

// Image 媒體模組導出
const image: MediaModule = {
  GET: async (c: Context, params: RouteParams): Promise<Response> => {
    try {
      const imageId = params.id;
      if (!imageId) return new Response('Missing image ID', { status: 400 });
      
      let response: Response | null = null;
      
      // 第一層防護：檢查是否為外部 URL
      if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
        response = await 從外部URL載入影像(imageId);
      }
      
      // 第二層防護：檢查是否為本地 file:// 指定路徑
      if (!response && imageId.startsWith('file://')) {
        const localPath = imageId.replace('file://', '');
        if (localPath.startsWith('/images/')) {
          const fileName = localPath.replace('/images/', '');
          response = await 從檔案系統載入影像(fileName);
        }
      }
      
      // 第三層防護：從三層資料庫載入 Base64 並解碼
      if (!response) {
        response = await 從資料庫載入影像(c, imageId);
      }
      
      // 第四層防護：嘗試檔案系統（將 ID 直接視為檔名作為最後兜底）
      if (!response) {
        response = await 從檔案系統載入影像(imageId);
      }
      
      // 萬一全部查無此圖，回傳 404
      if (!response) {
        return new Response('Image Not Found', { status: 404 });
      }
      
      return response;
    } catch (err) {
      await error('Image Media', `GET 影像異常: ${err}`);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

export default image;