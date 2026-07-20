// /utils/AI工具調用.ts — AI 工具調用迴圈（Function Calling）
//
// 與 自我修正.ts 的關係：
//   - 自我修正：AI 回傳純文字 JSON → 解析 → 驗證 → 錯誤修正
//   - 工具調用：AI 可以主動調用註冊的工具 → 執行 → 結果餵回 → 繼續對話
//
// 使用場景：ThemeGenerator 的調整佈景主題流程
//   租戶回饋 → AI 判斷需要哪個金剛 → 調用對應 generate_xxx → 結果餵回 → AI 組合最終主題
//
// 設計原則：
//   - 工具清單由外部注入（ToolRegistry.list()），不硬編碼
//   - 工具調用與自我修正共存：AI 調用完工具後，最終輸出仍需通過 JSON+驗證
//   - Provider 透明：不關心底層是哪個 provider

import { AIPoolManager } from '../services/aiService/pool.ts';
import { AITaskConfig, AI聊天訊息, ToolCall } from '../services/aiService/provider/adapter.ts';
import { Context } from 'hono';
import { info, warn } from './logger.ts';
import { 嘗試解析JSON } from './AI重試.ts';
import { ToolRegistry, Tool執行結果 } from './AIToolRegistry.ts';

// ── 型別定義 ──

export type 驗證器 = (json: unknown) => string | null;

export interface 工具調用選項 {
  /** 自訂驗證器：最終 JSON 通過此驗證才算成功 */
  驗證器?: 驗證器;
  /** 最大工具調用輪次（含首次生成），預設 5 */
  最大輪次?: number;
  /** 自我修正最大次數（最終 JSON 修正），預設 3 */
  最大修正次數?: number;
  /** 首次 temperature */
  初始溫度?: number;
  /** 修正 / 工具調用後 temperature */
  調整溫度?: number;
}

export interface 工具調用結果 {
  json: unknown;
  原始回應: string;
  serverID: string;
  providerType: string;
  /** 工具調用總次數（跨所有輪次） */
  工具調用次數: number;
  /** 工具調用紀錄 */
  紀錄: { 名稱: string; 成功: boolean; 摘要: string }[];
}

const DEFAULT_OPTIONS: Required<Omit<工具調用選項, '驗證器'>> = {
  最大輪次: 5,
  最大修正次數: 3,
  初始溫度: 0.7,
  調整溫度: 0.3,
};

// ── 輔助函數 ──

function 生成JSON語法提示(輪次: number): string {
  if (輪次 === 1) {
    return `⚠️ 你的回應無法解析為有效的 JSON，請檢查引號、括號、逗號是否正確。請只回傳純 JSON，不要加 \`\`\` 標記或任何說明。`;
  }
  return `⚠️ 你的回應仍然不是有效的 JSON。請務必只輸出純 JSON。`;
}

function 生成修正提示(錯誤: string): string {
  return `⚠️ 你上次的回應有問題，請修正後重新輸出。

【問題描述】
${錯誤}

【修正要求】
請只回傳修正後的完整 JSON，不要包含 Markdown 程式碼區塊標記或任何解釋文字。`;
}

/** 將工具執行結果格式化為 AI 可讀的文字 */
function 格式化工具結果(結果: Tool執行結果): string {
  if (結果.成功) {
    return `✅ 工具 "${結果.工具名稱}" 執行成功。\n結果：${JSON.stringify(結果.資料, null, 2)}`;
  }
  return `❌ 工具 "${結果.工具名稱}" 執行失敗。\n錯誤：${結果.錯誤}`;
}

// ── 核心：工具調用生成迴圈 ──

/**
 * 發送 AI 請求（含工具清單），AI 可以調用工具來完成任務。
 *
 * 流程：
 *   呼叫 AI（含工具清單）
 *     → AI 回傳 tool_calls？
 *       → 是：執行工具 → 結果餵回對話歷史 → 重新呼叫 AI
 *       → 否：解析 JSON → 驗證結構
 *         → 成功：回傳結果
 *         → 失敗：自我修正（同 自我修正生成 模式）
 */
export async function 工具調用生成(
  c: Context,
  系統提示: string,
  使用者訊息: AI聊天訊息[],
  taskConfig: AITaskConfig,
  選項: 工具調用選項 = {},
): Promise<工具調用結果> {
  const { 驗證器, 最大輪次, 最大修正次數, 初始溫度, 調整溫度 } = {
    ...DEFAULT_OPTIONS,
    ...選項,
  };

  const pool = new AIPoolManager(c);
  const 對話歷史: AI聊天訊息[] = [...使用者訊息];
  const 工具定義 = ToolRegistry.list();

  let 最後原始回應 = '';
  let serverID = '';
  let providerType = '';
  let 總工具調用次數 = 0;
  const 紀錄: { 名稱: string; 成功: boolean; 摘要: string }[] = [];

  // ── 外層迴圈：工具調用 ──
  for (let 輪次 = 0; 輪次 < 最大輪次; 輪次++) {
    const temperature = 輪次 === 0 ? 初始溫度 : 調整溫度;

    const { 回應, serverID: sid, providerType: pt } = await pool.聊天含工具(
      系統提示,
      對話歷史,
      工具定義,
      taskConfig,
      { maxTokens: 4096, temperature },
    );

    serverID = sid;
    providerType = pt;

    // ── 分支 A：AI 要求調用工具 ──
    if (回應.tool_calls && 回應.tool_calls.length > 0) {
      // 記錄 assistant 訊息（含 tool_calls）
      對話歷史.push({
        角色: 'assistant',
        內容: 回應.內容 || '',
        tool_calls: 回應.tool_calls,
      });

      // 執行所有 tool_call（同一輪可以並行）
      for (const tc of 回應.tool_calls) {
        總工具調用次數++;

        let 參數: Record<string, unknown>;
        try {
          參數 = JSON.parse(tc.function.arguments);
        } catch {
          參數 = {};
        }

        await info('AI工具調用', `調用工具: ${tc.function.name}(${JSON.stringify(參數).slice(0, 100)})`);
        const 結果 = await ToolRegistry.execute(tc.function.name, 參數);

        紀錄.push({
          名稱: tc.function.name,
          成功: 結果.成功,
          摘要: 結果.成功
            ? JSON.stringify(結果.資料).slice(0, 80)
            : (結果.錯誤 ?? '').slice(0, 80),
        });

        // 工具結果以 tool 角色餵回對話
        const 結果文字 = 格式化工具結果(結果);
        對話歷史.push({
          角色: 'tool',
          內容: 結果文字,
          tool_call_id: tc.id,
          name: tc.function.name,
        });
      }

      // 工具執行完畢，繼續下一輪（AI 會根據結果繼續對話）
      continue;
    }

    // ── 分支 B：AI 回傳一般文字（最終回答） ──
    最後原始回應 = 回應.內容;
    對話歷史.push({ 角色: 'assistant', 內容: 回應.內容 });

    // ── 嘗試解析 JSON ──
    const json = 嘗試解析JSON(回應.內容);

    if (json === null) {
      // JSON 語法錯誤 → 自我修正
      if (輪次 < 最大輪次 - 1) {
        對話歷史.push({ 角色: 'user', 內容: 生成JSON語法提示(輪次) });
        await warn('AI工具調用', `JSON 語法錯誤（第 ${輪次 + 1} 輪）`);
        continue;
      }
      throw new Error(`AI 回應無法解析為 JSON（已嘗試 ${最大輪次} 輪）。最後回應：${最後原始回應.slice(0, 200)}`);
    }

    // ── 結構驗證 ──
    if (驗證器) {
      const 錯誤 = 驗證器(json);

      if (錯誤 !== null) {
        if (輪次 < 最大輪次 - 1) {
          對話歷史.push({ 角色: 'user', 內容: 生成修正提示(錯誤) });
          await warn('AI工具調用', `結構驗證失敗（第 ${輪次 + 1} 輪）: ${錯誤.slice(0, 100)}`);
          continue;
        }
        throw new Error(
          `AI 經過 ${最大輪次} 輪仍無法通過驗證。\n` +
          `最後錯誤：${錯誤}\n` +
          `最後回應：${最後原始回應.slice(0, 300)}`,
        );
      }
    }

    // ── 成功！ ──
    if (總工具調用次數 > 0) {
      await info('AI工具調用', `完成：${總工具調用次數} 次工具調用，${輪次 + 1} 輪對話`);
    }
    return {
      json,
      原始回應: 最後原始回應,
      serverID,
      providerType,
      工具調用次數: 總工具調用次數,
      紀錄,
    };
  }

  throw new Error(`AI 工具調用超過最大輪次（${最大輪次}）仍無最終結果`);
}
