// Icon Media 模組 - 處理 圖示 媒體 請求
import { Context } from 'hono';
import { error } from '../../utils/logger.ts';
import { MediaModule, RouteParams } from './index.ts';
import 圖示 from "../../database/models/圖示.ts";
import { 資料池 } from '../../database/資料池.ts';
import { InnerAPI } from "../index.ts";

/**
 * 從三層資料庫載入圖示 (優化點：補上長效強快取與正則編碼優化)
 */
async function 從資料庫載入圖示(c: Context, iconId: string): Promise<Response | null> {
  try {
    const 查詢結果 = await 資料池.查詢單一<圖示>(iconId);
    
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

/**
 * 解析「選單」→ 從骨架設定取得選單按鈕圖示 ID
 */
async function 解析選單圖示ID(c: Context): Promise<string | null> {
  try {
    const 系統資訊 = c.get('系統資訊') as Record<string, unknown> | null;
    const 骨架ID = 系統資訊?.骨架 as string;
    if (!骨架ID) return null;
    const res = await InnerAPI(c, `/api/v1/cubes/${骨架ID}`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    return (data?.data?.選單按鈕 as string) || null;
  } catch {
    return null;
  }
}

const icon: MediaModule = {
  GET: async (c: Context, params: RouteParams): Promise<Response> => {
    try {
      let iconId = params.id;
      
      // 無 id → 回傳網站商標，再 fallback 到系統商標
      if (!iconId) {
        const 網站 = c.get('網站資訊') as Record<string, unknown> | null;
        const 系統 = c.get('系統資訊') as Record<string, unknown> | null;
        iconId = (網站?.商標 as string) || (系統?.商標 as string) || '圖示:圖示:web_cube';
      }

      // 「選單」→ 從骨架設定取得選單按鈕圖示
      if (iconId === '選單') {
        const 選單圖示ID = await 解析選單圖示ID(c);
        if (選單圖示ID) iconId = 選單圖示ID;
      }
      
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
