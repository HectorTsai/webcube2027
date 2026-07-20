// 佈景主題協調器 Task — 六大金剛智能組合 + AI 工具調用
//
// Phase 2（當前階段）：AI 主動調用子 generator 生成新模組
//   租戶描述 → 查詢六大金剛清單（已自動注入 prompt）→ AI 選配
//     → 既有模組夠用：直接回傳主題
//     → 既有模組不夠：AI 調用 generate_xxx 工具生成全新模組 → 組合 → 回傳
//   → 租戶不滿意 → 多輪對話調整（AI 自行決定何時調用工具）
//   → 租戶滿意 → 儲存佈景主題
//
// 擴充方式：
//   新增第七金剛時，只需在 tool-registry.ts 新增 register 呼叫，
//   ThemeGenerator 完全不需改動。

import { 取得域名 } from '../../../services/index.ts';
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤, AI聊天訊息 } from '../provider/adapter.ts';
import AI對話, { 對話訊息 } from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 工具調用生成 } from '../../../utils/AI工具調用.ts';
import { 驗證佈景主題結構 } from '../../../utils/結構驗證.ts';
import { 組合提示詞 } from '../../../utils/提示詞組合器.ts';
import { 初始化工具 } from './tool-registry.ts';

export const THEME_TASK_CONFIG: AITaskConfig = {
  類型: '佈景主題生成',
  最低能力值: 5,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.CSS與設計, AI能力標籤.結構化輸出, AI能力標籤.推理],
};

const DEFAULT_PROMPT = `你是 webcube 平台的佈景主題設計師。你負責為租戶設計完整的佈景主題。

你有兩種工作模式：

【模式 A：從既有模組選配】
當既有六大金剛清單中有符合租戶需求的模組時，直接挑選組合。

【模式 B：生成全新模組】
當既有清單中沒有符合需求的模組時，你可以調用以下工具生成全新模組：
- generate_color → 生成新配色方案
- generate_skeleton → 生成新骨架配置
- generate_style → 生成新風格
- generate_animate → 生成新動畫方案
- generate_ornament → 生成新裝飾配置
- generate_icon_set → 生成新圖示集

調用工具後，你必須使用工具回傳的新模組 ID 來組合最終主題。

最終回傳格式：
{
  "名稱": {"zh-tw": "咖啡店溫馨風", "en": "Cafe Cozy"},
  "描述": {"zh-tw": "溫暖的大地色調，搭配經典骨架與外框圖示", "en": "Warm earthy tones with classic skeleton and outline icons"},
  "配色": "L2:全域:配色:大地棕",
  "骨架": "L2:全域:骨架:經典",
  "風格": "L2:全域:風格:經典實心",
  "動畫": "L2:全域:動畫:基本",
  "裝飾": "L2:全域:裝飾:無裝飾",
  "圖示": "L2:全域:圖示集:經典外框",
  "組合原因": "因為租戶想要溫馨感，所以選擇大地棕色調..."
}

任務規則：
1. 優先從既有清單選擇，只有確實不符合時才生成新模組
2. 生成新模組時，描述越具體越好（色相角、亮度、風格關鍵詞等）
3. 每個金剛只選一個 ID
4. 「組合原因」必須用租戶的語言解釋選擇邏輯

具體的六大金剛規範與可用模組定義，請參考下方的設計規則與預取上下文清單。`;

/**
 * 佈景主題生成結果
 */
export interface 佈景主題生成結果 {
  /** AI 回傳的佈景主題 JSON（含組合原因） */
  主題提案: Record<string, unknown>;
  /** 對話 ID，用於多輪對話調整 */
  對話ID: string;
  /** 原始 AI 回應文本 */
  原始回應: string;
  /** 工具調用紀錄（供前端顯示） */
  工具紀錄?: { 名稱: string; 成功: boolean; 摘要: string }[];
}

export class ThemeGenerator {
  constructor(private c: Context) {}

  /**
   * 生成佈景主題 — 從六大金剛中智能組合（或生成新模組）
   * @param 描述 - 租戶對網站風格的描述（如「溫暖的咖啡店風格」）
   * @param 對話ID - 若為多輪對話調整，傳入既有對話 ID
   */
  async 生成佈景主題(描述: string, 對話ID?: string): Promise<佈景主題生成結果> {
    const 開始時間 = Date.now();
    let 對話: AI對話;

    try {
      // 初始化工具註冊（僅第一次）
      初始化工具(this.c);

      // 載入或建立對話
      if (對話ID) {
        const 既有對話 = await 資料池.查詢單一<AI對話>(對話ID);
        if (既有對話.success && 既有對話.data) {
          對話 = 既有對話.data;
        } else {
          對話 = this.建立新對話(描述);
        }
      } else {
        對話 = this.建立新對話(描述);
      }
      對話.新增訊息('user', 描述);

      // 組合提示詞（會自動注入六大金剛清單）
      const prompt = await 組合提示詞(
        this.c, 'AI提示詞:AI提示詞:theme-generator', DEFAULT_PROMPT, '佈景主題'
      );

      // 使用工具調用生成（AI 可自行決定是否調用 generate_xxx 工具）
      const { json, 原始回應, serverID, providerType, 紀錄 } = await 工具調用生成(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請為我設計一個佈景主題: ${描述}` }],
        THEME_TASK_CONFIG,
        { 驗證器: 驗證佈景主題結構 },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let 主題提案: Record<string, unknown> = {};
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        主題提案 = json as Record<string, unknown>;
      } else {
        主題提案 = { 錯誤: 'AI 回傳格式不正確', 原始回應 };
      }

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, {
        內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間
      }, 開始時間, true);

      return {
        主題提案,
        對話ID: 儲存結果.data?.id ?? '',
        原始回應,
        工具紀錄: 紀錄.length > 0 ? 紀錄 : undefined,
      };

    } catch (err) {
      await this.記錄使用('error', 'error', {
        內容: '', token數: 0, 耗時毫秒: 0
      }, 開始時間, false);
      throw err;
    }
  }

  /**
   * 調整佈景主題 — 根據租戶回饋，AI 可自行決定：
   *   - 換另一個既有模組
   *   - 調用 generate_xxx 工具生成全新模組
   * @param 回饋 - 租戶的不滿意原因（如「配色太暗了」「風格太剛硬」）
   * @param 對話ID - 既有對話 ID
   */
  async 調整佈景主題(回饋: string, 對話ID: string): Promise<佈景主題生成結果> {
    初始化工具(this.c);

    const 既有對話 = await 資料池.查詢單一<AI對話>(對話ID);
    if (!既有對話.success || !既有對話.data) {
      throw new Error(`找不到對話: ${對話ID}`);
    }

    const 對話 = 既有對話.data;
    對話.新增訊息('user', `請根據以下回饋調整主題: ${回饋}`);

    const prompt = await 組合提示詞(
      this.c, 'AI提示詞:AI提示詞:theme-generator', DEFAULT_PROMPT, '佈景主題'
    );

    const 歷史訊息 = this.提取歷史訊息(對話);

    // 使用工具調用生成（AI 可自行決定是否調用 generate_xxx 工具）
    const { json, 原始回應, serverID, providerType, 紀錄 } = await 工具調用生成(
      this.c,
      prompt,
      歷史訊息,
      THEME_TASK_CONFIG,
      { 驗證器: 驗證佈景主題結構 },
    );

    對話.新增訊息('assistant', 原始回應);
    對話.摘要 = `調整: ${回饋.slice(0, 50)}`;

    await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());

    return {
      主題提案: (json as Record<string, unknown>) ?? {},
      對話ID,
      原始回應,
      工具紀錄: 紀錄.length > 0 ? 紀錄 : undefined,
    };
  }

  /**
   * 儲存佈景主題 — 將最終確認的提案寫入資料庫
   * @param 對話ID - 對話 ID
   * @param 主題提案 - 已確認的佈景主題 JSON
   * @param 儲存目標 - '系統' 或 '網站'
   */
  async 儲存佈景主題(_對話ID: string, 主題提案: Record<string, unknown>, _儲存目標: '系統' | '網站' = '網站'): Promise<{ id: string }> {
    // deno-lint-ignore no-explicit-any
    const 結果 = await 資料池.創建或更新<any>('佈景主題', { ...主題提案, 可刪除: true });
    if (!結果.success) {
      throw new Error(`儲存佈景主題失敗: ${JSON.stringify(結果.error)}`);
    }

    return { id: 結果.data?.id ?? '' };
  }

  // ── 私有方法 ──

  private 建立新對話(描述: string): AI對話 {
    const 對話 = new AI對話();
    對話.類型 = '佈景主題生成';
    對話.標題 = `佈景主題: ${描述.slice(0, 30)}...`;
    對話.網站ID = 取得域名(this.c);
    對話.新增訊息('user', 描述);
    return 對話;
  }

  /** 將 AI對話 的 對話記錄 轉換為 AI聊天訊息[] */
  private 提取歷史訊息(對話: AI對話): AI聊天訊息[] {
    return 對話.對話記錄.map((m: 對話訊息): AI聊天訊息 => ({
      角色: m.角色,
      內容: m.內容,
    }));
  }

  private async 記錄使用(
    serverID: string,
    providerType: string,
    回應: { 內容: string; token數: number; 耗時毫秒: number },
    開始時間: number,
    成功: boolean,
  ) {
    try {
      const 記錄 = new AI使用記錄();
      記錄.網站ID = 取得域名(this.c);
      記錄.使用類型 = '佈景主題生成';
      記錄.provider = providerType;
      記錄.serverID = serverID;
      記錄.成功 = 成功;
      記錄.耗時毫秒 = 回應.耗時毫秒 || (Date.now() - 開始時間);
      記錄.token數 = 回應.token數;
      await 資料池.創建或更新<AI使用記錄>('AI使用記錄', 記錄.toJSON());
    } catch (err) {
      await error('ThemeGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
