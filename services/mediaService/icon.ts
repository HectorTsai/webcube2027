// Icon Media 模組 - 處理 圖示 媒體 請求
import { Context } from 'hono';
import { error } from '../../utils/logger.ts';
import { MediaModule, RouteParams } from './index.ts';
import 圖示 from "../../database/models/圖示.ts";
import { 三層查詢管理器 } from '../../database/core/three-tier-query.ts';

/**
 * 從三層資料庫載入圖示 (優化點：補上長效強快取與正則編碼優化)
 */
async function 從資料庫載入圖示(c: Context, iconId: string): Promise<Response | null> {
  try {
    const 查詢結果 = await 三層查詢管理器.查詢單一<圖示>(c, iconId);
    
    if (!查詢結果.success || !查詢結果.data) {
      return null;
    }
    
    const 圖示資料 = 查詢結果.data;
    
    if (圖示資料.資料 && 圖示資料.資料.format === 'SVG') {
      const 內容 = 圖示資料.資料.content;
      
      if (typeof 內容 === 'string' && 內容.trim().startsWith('<svg')) {
        try {
          const fileContent = new TextEncoder().encode(內容);
          return new Response(fileContent, {
            status: 200,
            headers: {
              'Content-Type': 'image/svg+xml; charset=utf-8',
              'Cache-Control': 'public, max-age=31536000, immutable' // 圖示強快取 1 年
            }
          });
        } catch {
          return null;
        }
      }
    }
    return null;
  } catch (err) {
    await error('Icon Media', `資料庫讀取圖示異常: ${err}`);
    return null;
  }
}

/**
 * 從檔案系統載入圖示 (修正：全面改為 Deno.open 串流模式)
 */
async function 從檔案系統載入圖示(fileName: string): Promise<Response | null> {
  try {
    if (fileName.includes('..')) return null;

    const localPath = `./public/icons/${fileName}`;
    try {
      await Deno.stat(localPath);
      const file = await Deno.open(localPath, { read: true });
      
      return new Response(file.readable, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function 從外部URL載入圖示(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    
    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch {
    return null;
  }
}

const icon: MediaModule = {
  GET: async (c: Context, params: RouteParams): Promise<Response> => {
    try {
      const iconId = params.id;
      if (!iconId) return new Response('Missing icon ID', { status: 400 });
      
      let response: Response | null = null;
      
      if (iconId.startsWith('http://') || iconId.startsWith('https://')) {
        response = await 從外部URL載入圖示(iconId);
      }
      
      if (!response && iconId.startsWith('file://')) {
        const localPath = iconId.replace('file://', '');
        if (localPath.startsWith('/icons/')) {
          const fileName = localPath.replace('/icons/', '');
          response = await 從檔案系統載入圖示(fileName);
        }
      }
      
      if (!response) {
        response = await 從資料庫載入圖示(c, iconId);
      }
      
      if (!response) {
        response = await 從檔案系統載入圖示(iconId);
      }
      
      if (!response) {
        return new Response('Icon Not Found', { status: 404 });
      }
      
      return response;
    } catch (err) {
      await error('Icon Media', `GET 圖示異常: ${err}`);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

export default icon;