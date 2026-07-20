// 風格生成 Task — 與 AI 對話生成新的風格模組
// 內建自我修正迴圈：AI 產生 JSON 後自動驗證結構，發現問題自動修正（最多 3 輪）

import { 取得域名 } from '../../../services/index.ts';
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 自我修正生成 } from '../../../utils/自我修正.ts';
import { 驗證風格結構 } from '../../../utils/結構驗證.ts';
import { 組合提示詞 } from '../../../utils/提示詞組合器.ts';

export const STYLE_TASK_CONFIG: AITaskConfig = {
  類型: '風格生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.CSS與設計, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的 CSS 風格生成專家。
風格是一組 CSS 變數組合拳，儲存在「配置」物件中。

回傳格式：{ "名稱": {"zh-tw":"", "en":""}, "描述"?: {"zh-tw":"", "en":""}, "配置": { key: value } }

支援的 CSS 變數 key（但不限於）：gradient, pattern, pattern-size, bg-image-compose, border, shadow, text-color, hover-bg, hover-shadow

任務規則：
1. 顏色使用 oklch() 格式（如 oklch(60% 0.32 310)）
2. 風格要符合使用者描述的視覺效果
3. 配置至少包含一個 CSS 變數

具體的五態設計規範、OKLCH 色彩標準、配色/骨架聯動規則，請參考下方的設計規則。`;

export class StyleGenerator {
  constructor(private c: Context) {}

  async 生成風格(描述: string, 儲存目標: '系統' | '網站' = '網站'): Promise<{ 風格Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '風格生成';
      對話.標題 = `風格: ${描述.slice(0, 30)}...`;
      對話.網站ID = 取得域名(this.c);
      對話.新增訊息('user', `生成風格（儲存於${儲存目標}）: ${描述}`);

      const prompt = await 組合提示詞(this.c, 'AI提示詞:AI提示詞:style-generator', DEFAULT_PROMPT, '風格');
      const { json, 原始回應, serverID, providerType } = await 自我修正生成(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請生成一個風格: ${描述}` }],
        STYLE_TASK_CONFIG,
        { 驗證器: 驗證風格結構 },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let 風格Data: Record<string, unknown> = {};
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        風格Data = json as Record<string, unknown>;
      } else {
        風格Data = { 原始回應 };
      }

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return { 風格Data, 對話ID: 儲存結果.data?.id ?? '' };
    } catch (err) {
      await this.記錄使用('error', 'error', { 內容: '', token數: 0, 耗時毫秒: 0 }, 開始時間, false);
      throw err;
    }
  }

  private async 記錄使用(serverID: string, providerType: string, 回應: { 內容: string; token數: number; 耗時毫秒: number }, 開始時間: number, 成功: boolean) {
    try {
      const 記錄 = new AI使用記錄();
      記錄.網站ID = 取得域名(this.c);
      記錄.使用類型 = '風格生成';
      記錄.provider = providerType;
      記錄.serverID = serverID;
      記錄.成功 = 成功;
      記錄.耗時毫秒 = 回應.耗時毫秒 || (Date.now() - 開始時間);
      記錄.token數 = 回應.token數;
      await 資料池.創建或更新<AI使用記錄>('AI使用記錄', 記錄.toJSON());
    } catch (err) {
      await error('StyleGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
