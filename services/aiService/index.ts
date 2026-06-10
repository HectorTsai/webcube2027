// AI Service Router — 處理所有 /api/v1/ai/* 請求
// 各 task 在此綁定路由

import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';
import { PageGenerator } from './task/page-generator.ts';
import { StyleGenerator } from './task/style-generator.ts';
import { CubeGenerator } from './task/cube-generator.ts';
import { Translator } from './task/translator.ts';
import { CustomerService } from './task/customer-service.ts';
import { 處理Assist請求 } from './assist.ts';
import { AIPoolManager } from './pool.ts';

/**
 * 處理 AI Service 請求（由 main.ts 分發）
 */
export async function 處理AI請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;

  // 解析路徑: /api/v1/ai/xxx 或 /api/v1/ai/xxx/yyy
  const aiPath = path.replace('/api/v1/ai/', '').replace('/api/v1/ai', '');

  try {
    switch (true) {
      // ── 頁面生成 ──
      case method === 'POST' && aiPath === 'page/generate': {
        const body = await c.req.json();
        const generator = new PageGenerator(c);
        const result = await generator.生成頁面(body.描述 || '', body.語言);
        return c.json({ success: true, data: result });
      }
      case method === 'POST' && aiPath.startsWith('page/chat/'): {
        const 對話ID = aiPath.replace('page/chat/', '');
        const body = await c.req.json();
        const generator = new PageGenerator(c);
        const result = await generator.繼續對話(對話ID, body.訊息 || '');
        return c.json({ success: true, data: result });
      }

      // ── 風格生成 ──
      case method === 'POST' && aiPath === 'style/generate': {
        const body = await c.req.json();
        const generator = new StyleGenerator(c);
        const result = await generator.生成風格(body.描述 || '', body.儲存目標);
        return c.json({ success: true, data: result });
      }

      // ── Cube 生成 ──
      case method === 'POST' && aiPath === 'cube/generate': {
        const body = await c.req.json();
        const generator = new CubeGenerator(c);
        const result = await generator.生成Cube(body.描述 || '', body.儲存目標);
        return c.json({ success: true, data: result });
      }

      // ── 翻譯 ──
      case method === 'POST' && aiPath === 'translate': {
        const body = await c.req.json();
        const translator = new Translator(c);
        const result = await translator.翻譯(
          body.text || '',
          body.sourceLang || 'zh-tw',
          body.targetLangs || ['en'],
        );
        return c.json({ success: true, data: result });
      }
      case method === 'POST' && aiPath === 'translate/batch': {
        const body = await c.req.json();
        const translator = new Translator(c);
        const result = await translator.批次翻譯(
          body.texts || [],
          body.sourceLang || 'zh-tw',
          body.targetLangs || ['en'],
        );
        return c.json({ success: true, data: result });
      }

      // ── 客服 ──
      case method === 'POST' && aiPath === 'chat': {
        const body = await c.req.json();
        const cs = new CustomerService(c);
        const result = await cs.問答(body.問題 || '', body.對話ID);
        return c.json({ success: true, data: result });
      }
      case method === 'POST' && aiPath.startsWith('chat/'): {
        const 對話ID = aiPath.replace('chat/', '');
        const body = await c.req.json();
        const cs = new CustomerService(c);
        const result = await cs.問答(body.問題 || '', 對話ID);
        return c.json({ success: true, data: result });
      }

      // ── AI 小幫手 ──
      case method === 'POST' && aiPath.startsWith('assist'):
        return 處理Assist請求(c);

      // ── AI Server 列表 ──
      case method === 'GET' && aiPath === 'servers': {
        const pool = new AIPoolManager(c);
        await pool.觸發Pool載入(); // 確保 Pool 已初始化
        return c.json({ success: true, data: AIPoolManager.列出Server() });
      }

      // ── AI 對話歷史 ──
      case method === 'GET' && aiPath === 'conversations': {
        const { 三層查詢管理器 } = await import('../../database/core/three-tier-query.ts');
        const result = await 三層查詢管理器.查詢列表(c, 'AI對話', 50, 0);
        return c.json({ success: true, data: result.data });
      }
      case method === 'GET' && aiPath.startsWith('conversations/'): {
        const id = aiPath.replace('conversations/', '');
        const { 三層查詢管理器 } = await import('../../database/core/three-tier-query.ts');
        const result = await 三層查詢管理器.查詢單一(c, id);
        return c.json({ success: true, data: result.data });
      }

      default:
        return c.json({
          success: false,
          error: { code: 'NOT_FOUND', message: `未知的 AI 端點: ${method} ${path}` },
        }, 404);
    }
  } catch (err) {
    await error('AI Service', `請求失敗: ${err}`);
    return c.json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: err instanceof Error ? err.message : 'AI 服務錯誤',
      },
    }, 500);
  }
}
