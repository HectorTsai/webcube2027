// Script 模組 - 處理 JavaScript 檔案服務
import { Context } from 'hono';
import { error } from '../../utils/logger.ts';
import { MediaModule, RouteParams } from './index.ts';

const script: MediaModule = {
  /**
   * GET /media/v1/script/:id
   * 修正：加入 Path Traversal 攻擊安全防禦，並改用全 Stream 零記憶體讀取
   */
  GET: async (c: Context, params: RouteParams): Promise<Response> => {
    try {
      const scriptName = params.id;
      
      if (!scriptName) {
        return new Response('Missing script name', { 
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // 🔥 安全性防禦：過濾惡意路徑探測字元，防範路徑穿越攻擊 (Path Traversal)
      if (scriptName.includes('..') || scriptName.includes('/') || scriptName.includes('\\')) {
        await error('Script Service', `攔截潛在惡意路徑請求: ${scriptName}`);
        return new Response('Forbidden Path Access', { 
          status: 403, 
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // 使用 Deno 2.x 標準路徑拼接
      const scriptPath = `${import.meta.dirname}/../../scripts/${scriptName}`;
      
      try {
        await Deno.stat(scriptPath);
      } catch {
        return new Response('Script Not Found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      try {
        // 🔥 核心修正：改用 Deno.open 的 readable 串流，杜絕大檔案擠爆記憶體
        const file = await Deno.open(scriptPath, { read: true });
        
        const headers = new Headers({
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=86400', // 1天快取
          'Access-Control-Allow-Origin': '*', // 允許跨域
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        return new Response(file.readable, { headers });
        
      } catch (fileError) {
        await error('Script Service', `開啟腳本檔案失敗: ${scriptPath} - ${fileError}`);
        return new Response('Script File Read Error', { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
    } catch (err) {
      await error('Script Service', `腳本處理異常: ${err}`);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

export default script;