// Script 模組 - 處理 JavaScript 檔案服務
import { Context } from 'hono';
import { error } from '../../utils/logger.ts';
import { MediaModule, RouteParams } from './index.ts';

// Script Media 模組
const script: MediaModule = {
  // GET /media/v1/script/:id
  GET: async (c: Context, params: RouteParams): Promise<Response> => {
    try {
      const scriptName = params.id;
      
      if (!scriptName) {
        return new Response('Missing script name', { 
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // 使用 Deno 2.x 標準方法
      const scriptPath = `${import.meta.dirname}/../../scripts/${scriptName}`;
      
      try {
        // 檢查檔案是否存在
        await Deno.stat(scriptPath);
      } catch {
        return new Response('Script Not Found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      try {
        // 讀取腳本檔案
        const scriptContent = await Deno.readFile(scriptPath);
        
        // 設定適當的 Content-Type 和快取標頭
        const headers = new Headers({
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=86400', // 1天快取
          'Access-Control-Allow-Origin': '*', // 允許跨域
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        return new Response(scriptContent, { headers });
        
      } catch (fileError) {
        await error('Script Service', `讀取腳本檔案失敗: ${scriptPath} - ${fileError}`);
        
        return new Response('Script File Read Error', { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
    } catch (err) {
      await error('Script Service', `腳本服務處理失敗: ${err}`);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

export default script;
