// /utils/AI重試.ts — AI JSON 回應自動重試工具
// 當 LLM 回傳的 JSON 格式錯誤時，自動重試一次並要求純 JSON

import { AIPoolManager } from '../services/aiService/pool.ts';
import { AITaskConfig, AI聊天訊息 } from '../services/aiService/provider/adapter.ts';
import { Context } from 'hono';
import { info, warn } from './logger.ts';

export interface AI重試選項 {
  /** 重試時的額外提示字串，預設為「請只回傳純 JSON，不要包含任何其他文字」 */
  重試提示?: string;
  /** 最大重試次數，預設 1 */
  最大重試次數?: number;
}

const DEFAULT_OPTIONS: Required<AI重試選項> = {
  重試提示: '請只回傳純 JSON，不要包含任何其他文字',
  最大重試次數: 1,
};

/**
 * 發送聊天請求並嘗試解析 JSON，失敗時自動重試
 * @returns 解析後的 JSON 物件與原始回應內容
 */
export async function 聊天並解析JSON(
  c: Context,
  系統提示: string,
  使用者訊息: AI聊天訊息[],
  taskConfig: AITaskConfig,
  選項: AI重試選項 = {},
): Promise<{ json: unknown; 原始回應: string; serverID: string; providerType: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...選項 };
  const pool = new AIPoolManager(c);

  for (let 嘗試次數 = 0; 嘗試次數 <= opts.最大重試次數; 嘗試次數++) {
    // 首次使用原始訊息，重試時加上額外提示
    const 訊息 = 嘗試次數 === 0
      ? 使用者訊息
      : [
          ...使用者訊息,
          { 角色: 'user' as const, 內容: opts.重試提示 },
        ];

    const { 回應, serverID, providerType } = await pool.聊天(系統提示, 訊息, taskConfig, {
      maxTokens: 2048,
      temperature: 嘗試次數 === 0 ? 0.7 : 0.3, // 重試時降低溫度
    });

    const 原始回應 = 回應.內容;
    const json = 嘗試解析JSON(原始回應);

    if (json !== null) {
      if (嘗試次數 > 0) {
        await info('AI重試', `第 ${嘗試次數 + 1} 次嘗試成功解析 JSON`);
      }
      return { json, 原始回應, serverID, providerType };
    }

    if (嘗試次數 < opts.最大重試次數) {
      await warn('AI重試', `JSON 解析失敗（嘗試 ${嘗試次數 + 1}/${opts.最大重試次數 + 1}），準備重試`);
    }
  }

  throw new Error(`AI 回應無法解析為 JSON，已重試 ${opts.最大重試次數} 次仍失敗`);
}

/**
 * 嘗試從字串中擷取並解析 JSON（支援陣列和物件）
 */
export function 嘗試解析JSON(內容: string): unknown | null {
  // 先嘗試物件（避免被內嵌的空陣列 "問題": [] 搶先匹配）
  const objMatch = 內容.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch { /* fall through */ }
  }

  // 再嘗試陣列
  const arrMatch = 內容.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch { /* fall through */ }
  }

  return null;
}