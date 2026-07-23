/**
 * aiService/index.ts — AI 服務入口
 *
 * 提供：
 * 1. 初始化 AI 資源池（從 data-gateway 載入伺服器設定）
 * 2. OpenAI 相容 API 的實作（chat completions、embeddings、models）
 */

import { error, info } from '@dui/util';
import { aiPool } from './pool.ts';

// ── 初始化 ──

let initialized = false;

export async function initAIService(): Promise<void> {
  if (initialized) return;
  await aiPool.loadServers();
  initialized = true;
  await info('AI Service', 'AI 服務初始化完成');
}

// ── OpenAI 相容 API ──

export async function handleChatCompletion(body: {
  model: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}) {
  const response = await aiPool.dispatch({
    model: body.model,
    messages: body.messages,
    stream: body.stream ?? false,
    maxTokens: body.maxTokens,
    temperature: body.temperature,
  });

  return {
    id: response.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: response.content },
        finishReason: 'stop',
      },
    ],
    usage: {
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
    },
  };
}

export async function handleEmbeddings(body: {
  model: string;
  input: string | string[];
}) {
  // TODO: implement embedding support when providers expose it
  throw new Error('Embedding API 尚未實作');
}

export async function listModels() {
  const models: { id: string; object: string; created: number; ownedBy: string }[] = [];

  for (const 伺服器 of aiPool.values()) {
    for (const m of 伺服器.模型列表) {
      models.push({
        id: m.名稱.toString(),
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        ownedBy: 伺服器.provider,
      });
    }
  }

  return {
    object: 'list',
    data: models,
  };
}