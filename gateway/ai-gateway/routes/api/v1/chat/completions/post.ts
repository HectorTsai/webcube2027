/**
 * POST /api/v1/chat/completions — OpenAI 相容聊天完成 API
 */

import type { Context } from 'hono';
import { initAIService, handleChatCompletion } from '../../../../../services/aiService/index.ts';

export async function onPost(c: Context) {
  try {
    await initAIService();
    const body = await c.req.json();
    const result = await handleChatCompletion(body);
    return c.json(result);
  } catch (err) {
    return c.json({
      error: { message: String(err), type: 'server_error' },
    }, 500);
  }
}