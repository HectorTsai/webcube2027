/**
 * GET /api/v1/models — 列出所有可用模型（OpenAI 相容）
 */

import type { Context } from 'hono';
import { initAIService, listModels } from '../../../../services/aiService/index.ts';

export async function onGet(c: Context) {
  try {
    await initAIService();
    const result = await listModels();
    return c.json(result);
  } catch (err) {
    return c.json({
      error: { message: String(err), type: 'server_error' },
    }, 500);
  }
}