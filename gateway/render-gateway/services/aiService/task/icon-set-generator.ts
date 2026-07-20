// 圖示集生成 Task — 與 AI 對話生成新的圖示集（語義鍵位版）
// 內建自我修正迴圈：AI 必須填滿 14 個標準鍵位，否則自動修正（最多 3 輪）
//
// 圖示集 = 14 個標準語義鍵位 → 既有圖示 ID 的對照表
// AI 需要從既有圖示庫中挑選最合適的圖示來填滿每個鍵位。

import { 取得域名 } from '../../../services/index.ts';
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 自我修正生成 } from '../../../utils/自我修正.ts';
import { 驗證圖示集結構 } from '../../../utils/結構驗證.ts';
import { 組合提示詞 } from '../../../utils/提示詞組合器.ts';

export const ICON_SET_TASK_CONFIG: AITaskConfig = {
  類型: '圖示集生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的圖示集生成專家。
圖示集是一組 14 個標準語義鍵位 → 圖示 ID 的對照表，用於佈景主題的圖示統一管理。

14 個標準鍵位（必須全填滿）：
  首頁、選單、新增、關閉、確認、取消、搜尋、使用者、設定、主題、配色、骨架、圖示、圖示集

回傳格式：
{
  "名稱": {"zh-tw": "圓潤可愛風", "en": "Cute Rounded"},
  "描述": {"zh-tw": "圓潤可愛風格的圖示組合", "en": "Cute rounded icon set"},
  "圖示映射": {
    "首頁":   "圖示:圖示:首頁",
    "選單":   "圖示:圖示:選單",
    "新增":   "圖示:圖示:新增",
    "關閉":   "圖示:圖示:減法",
    "確認":   "圖示:圖示:登入",
    "取消":   "圖示:圖示:登出",
    "搜尋":   "圖示:圖示:資訊",
    "使用者": "圖示:圖示:使用者",
    "設定":   "圖示:圖示:鑰匙",
    "主題":   "圖示:圖示:調色盤",
    "配色":   "圖示:圖示:調色盤",
    "骨架":   "圖示:圖示:web_cube",
    "圖示":   "圖示:圖示:web_cube",
    "圖示集": "圖示:圖示:資料庫"
  }
}

任務規則：
1. 13 個鍵位必須全填滿（缺少任何一個都會被驗證器拒絕）
2. 每個鍵位的值必須是既有的圖示 ID（格式：圖示:圖示:xxx）
3. 若既有圖示庫沒有完美對應的圖示，選最接近的替代（如「關閉」可用「減法」）
4. 圖示集的名稱要反映風格（如「經典外框」、「圓潤可愛」、「極簡細線」）

具體的圖示集規範請參考下方的設計規則與預取上下文清單。`;

export class IconSetGenerator {
  constructor(private c: Context) {}

  async 生成圖示集(描述: string, 儲存目標: '系統' | '網站' = '網站'): Promise<{ 圖示集Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '佈景主題生成';
      對話.標題 = `圖示集: ${描述.slice(0, 30)}...`;
      對話.網站ID = 取得域名(this.c);
      對話.新增訊息('user', `生成圖示集（儲存於${儲存目標}）: ${描述}`);

      const prompt = await 組合提示詞(this.c, 'AI提示詞:AI提示詞:icon-set-generator', DEFAULT_PROMPT, '佈景主題');
      const { json, 原始回應, serverID, providerType } = await 自我修正生成(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請生成一個圖示集: ${描述}` }],
        ICON_SET_TASK_CONFIG,
        { 驗證器: 驗證圖示集結構 },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let 圖示集Data: Record<string, unknown> = {};
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        圖示集Data = json as Record<string, unknown>;
      } else {
        圖示集Data = { 錯誤: '回傳格式不正確', 原始回應 };
      }

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return { 圖示集Data, 對話ID: 儲存結果.data?.id ?? '' };
    } catch (err) {
      await this.記錄使用('error', 'error', { 內容: '', token數: 0, 耗時毫秒: 0 }, 開始時間, false);
      throw err;
    }
  }

  private async 記錄使用(serverID: string, providerType: string, 回應: { 內容: string; token數: number; 耗時毫秒: number }, 開始時間: number, 成功: boolean) {
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
      await error('IconSetGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
