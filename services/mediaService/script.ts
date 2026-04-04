// Script 模組 - 處理 JavaScript 檔案服務
import { Context } from 'hono';
import { error } from '../../utils/logger.ts';

// GET - 動態提供 JavaScript 檔案
export async function GET(c: Context, params: { id?: string }): Promise<Response> {
  try {
    const scriptName = params.id;
    
    if (!scriptName) {
      return c.json({
        success: false,
        message: '缺少腳本名稱',
        error: 'MISSING_SCRIPT_NAME'
      }, 400);
    }
    
    // 使用 Deno 2.x 標準方法
    const scriptPath = `${import.meta.dirname}/../../scripts/${scriptName}`;
    
    try {
      // 檢查檔案是否存在
      await Deno.stat(scriptPath);
    } catch {
      return c.json({
        success: false,
        message: '腳本檔案不存在',
        error: 'FILE_NOT_FOUND'
      }, 404);
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
      
      return c.json({
        success: false,
        message: '腳本檔案讀取失敗',
        error: 'FILE_READ_ERROR'
      }, 500);
    }
    
  } catch (err) {
    await error('Script Service', `腳本服務處理失敗: ${err}`);
    return c.json({
      success: false,
      message: '腳本服務處理失敗',
      error: (err as Error).toString()
    }, 500);
  }
}
