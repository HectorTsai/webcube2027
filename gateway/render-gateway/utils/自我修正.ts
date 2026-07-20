// /utils/自我修正.ts — AI 自我修正生成迴圈
// 核心升級：讓 AI 看到自己的錯誤並自動修正，最多 3 輪
//
// 使用方式：
//   import { 自我修正生成 } from '...';
//   const { json } = await 自我修正生成(c, prompt, messages, config, {
//     驗證器: 驗證方塊結構,  // 可選
//   });

import { AIPoolManager } from '../services/aiService/pool.ts';
import { AITaskConfig, AI聊天訊息 } from '../services/aiService/provider/adapter.ts';
import { Context } from 'hono';
import { info, warn } from './logger.ts';
import { 嘗試解析JSON } from './AI重試.ts';

// ── 型別定義 ──

export interface 驗證結果 {
  /** null = 通過驗證，字串 = 錯誤訊息 */
  錯誤: string | null;
}

export type 驗證器 = (json: unknown) => string | null;

export interface 自我修正選項 {
  /** 自訂驗證器：接收解析後的 JSON，回傳 null（通過）或錯誤訊息字串 */
  驗證器?: 驗證器;
  /** 最大修正次數（含首次生成），預設 3 */
  最大修正次數?: number;
  /** 最終 fallback 重試提示 */
  重試提示?: string;
  /** 首次 temperature */
  初始溫度?: number;
  /** 修正時 temperature */
  修正溫度?: number;
}

export interface 自我修正結果 {
  json: unknown;
  原始回應: string;
  serverID: string;
  providerType: string;
  /** 用了幾次修正（0 = 首次就成功） */
  修正次數: number;
}

const DEFAULT_OPTIONS: Required<Omit<自我修正選項, '驗證器'>> = {
  最大修正次數: 3,
  重試提示: '請只回傳純 JSON，不要包含任何其他文字',
  初始溫度: 0.7,
  修正溫度: 0.3,
};

// ── 錯誤訊息生成器 ──

/**
 * 將驗證錯誤轉換為 AI 能理解的修正指示
 */
function 生成修正提示(錯誤: string, 輪次: number): string {
  return `⚠️ 你上次的回應有問題，請修正後重新輸出。

【問題描述】
${錯誤}

【修正要求】
請只回傳修正後的完整 JSON，不要包含 Markdown 程式碼區塊標記（\`\`\`json 等）或任何解釋文字。`;
}

function 生成JSON語法提示(輪次: number): string {
  if (輪次 === 1) {
    return `⚠️ 你的回應無法解析為有效的 JSON，請檢查以下常見語法問題：
- 所有字串必須用雙引號 " 包圍
- 物件和陣列的括號必須成對閉合
- 每個 key-value 之間用 : ，每組之間用 ,
- 最後一個元素後面不能有逗號
請只回傳修正後的純 JSON，不要加任何其他文字。`;
  }
  return `⚠️ 你的回應仍然不是有效的 JSON。請務必只輸出純 JSON，檢查引號、括號、逗號是否正確。不要加 \`\`\` 標記或任何說明。`;
}

// ── 核心：自我修正生成迴圈 ──

/**
 * 發送 AI 請求，自動解析 JSON，驗證結構，失敗時將具體錯誤餵回 AI 修正
 *
 * 流程：
 *   呼叫 LLM → 解析 JSON → 驗證結構
 *     → 成功：回傳結果
 *     → 失敗：把具體錯誤訊息加入對話歷史 → 重新呼叫 LLM（最多 N 輪）
 */
export async function 自我修正生成(
  c: Context,
  系統提示: string,
  使用者訊息: AI聊天訊息[],
  taskConfig: AITaskConfig,
  選項: 自我修正選項 = {},
): Promise<自我修正結果> {
  const { 驗證器, 最大修正次數, 重試提示, 初始溫度, 修正溫度 } = {
    ...DEFAULT_OPTIONS,
    ...選項,
  };
  const pool = new AIPoolManager(c);

  // 對話歷史：用於多輪修正時保留上下文
  const 對話歷史 = [...使用者訊息];
  let 最後原始回應 = '';
  let serverID = '';
  let providerType = '';

  for (let 輪次 = 0; 輪次 < 最大修正次數; 輪次++) {
    const temperature = 輪次 === 0 ? 初始溫度 : 修正溫度;

    const { 回應, serverID: sid, providerType: pt } = await pool.聊天(
      系統提示,
      對話歷史,
      taskConfig,
      { maxTokens: 4096, temperature },
    );

    最後原始回應 = 回應.內容;
    serverID = sid;
    providerType = pt;

    // ── 步驟 1：嘗試解析 JSON ──
    const json = 嘗試解析JSON(回應.內容);

    if (json === null) {
      // JSON 語法錯誤：告訴 AI 具體問題
      if (輪次 < 最大修正次數 - 1) {
        const 提示 = 生成JSON語法提示(輪次);
        對話歷史.push({ 角色: 'user', 內容: 提示 });
        await warn('自我修正', `JSON 語法錯誤（第 ${輪次 + 1} 輪），準備重試`);
        continue;
      }
      throw new Error(`AI 回應無法解析為 JSON（已嘗試 ${最大修正次數} 次）。最後回應片段：${最後原始回應.slice(0, 200)}`);
    }

    // ── 步驟 2：結構驗證（如果有驗證器） ──
    if (驗證器) {
      const 錯誤 = 驗證器(json);

      if (錯誤 !== null) {
        // 結構錯誤：告訴 AI 具體哪裡不對
        if (輪次 < 最大修正次數 - 1) {
          const 提示 = 生成修正提示(錯誤, 輪次);
          對話歷史.push({ 角色: 'user', 內容: 提示 });
          await warn('自我修正', `結構驗證失敗（第 ${輪次 + 1} 輪）: ${錯誤.slice(0, 100)}`);
          continue;
        }
        // 最後一輪還是失敗：回傳最後結果但附上錯誤
        throw new Error(
          `AI 經過 ${最大修正次數} 次修正後仍無法通過驗證。\n` +
          `最後錯誤：${錯誤}\n` +
          `最後回應片段：${最後原始回應.slice(0, 300)}`,
        );
      }
    }

    // ── 成功！ ──
    if (輪次 > 0) {
      await info('自我修正', `第 ${輪次 + 1} 次嘗試成功（修正 ${輪次} 次）`);
    }
    return { json, 原始回應: 最後原始回應, serverID, providerType, 修正次數: 輪次 };
  }

  // 理論上不會到這裡（迴圈內已處理所有情況）
  throw new Error(`AI 自我修正失敗（未知錯誤）`);
}
