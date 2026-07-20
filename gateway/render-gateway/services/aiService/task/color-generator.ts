// 配色生成 Task — 與 AI 對話生成新的配色方案（9 色 OKLCH 值）
//
// 配色 = 主色 + 次色 + 強調色 + 中性色 + 背景色 + 資訊色 + 成功色 + 警告色 + 錯誤色
// 全部使用 OKLCH 格式（L% C h），對應 DaisyUI 色彩變數。

import { 取得域名 } from '../../../services/index.ts';
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 自我修正生成 } from '../../../utils/自我修正.ts';
import { 驗證配色結構 } from '../../../utils/結構驗證.ts';
import { 組合提示詞 } from '../../../utils/提示詞組合器.ts';

export const COLOR_TASK_CONFIG: AITaskConfig = {
  類型: '配色生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的配色方案生成專家。
配色方案定義了網站的全域色彩系統，包含 9 個核心色值（全部使用 OKLCH 格式）。

配色規範：
- 所有色值使用 OKLCH 格式：L% C h（亮度% + 彩度 + 色相角）
- 主色（primary）：品牌主色調，決定網站整體視覺印象
- 次色（secondary）：輔助色調，比主色柔和 15-20%
- 強調色（accent）：高亮色，用於 CTA 按鈕、重點標示，比主色更亮更純
- 中性色（neutral）：灰色基底，用於文字、邊框、背景過渡
- 背景色（base-100）：主背景色，通常接近白色或極淺色
- 資訊色（info）：藍色系，用於資訊提示
- 成功色（success）：綠色系，用於成功提示
- 警告色（warning）：橙/黃色系，用於警告提示
- 錯誤色（error）：紅色系，用於錯誤提示

回傳格式：
{
  "名稱": {"zh-tw": "溫暖大地色", "en": "Warm Earth"},
  "描述": {"zh-tw": "以大地色系為基底的溫暖配色方案", "en": "Warm earth-toned color scheme"},
  "主色": "55% 0.15 65",
  "次色": "40% 0.10 55",
  "強調色": "70% 0.20 45",
  "中性色": "30% 0.02 260",
  "背景色": "98% 0 0",
  "資訊色": "65% 0.15 240",
  "成功色": "55% 0.13 150",
  "警告色": "65% 0.18 55",
  "錯誤色": "50% 0.22 25"
}

任務規則：
1. 9 個色值必須全部以 OKLCH 格式提供（L C h 三段值）
2. 色相角（h）需合理：主色/次色/強調色協調，資訊藍/成功綠/警告黃/錯誤紅
3. 背景色亮度 L 建議 ≥ 95%
4. 中性色亮度 L 建議 25-40%
5. 配色名稱要反映風格特徵

具體規範請參考下方的設計規則。`;

export class ColorGenerator {
  constructor(private c: Context) {}

  async 生成配色(描述: string): Promise<{ 配色Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '佈景主題生成';
      對話.標題 = `配色: ${描述.slice(0, 30)}...`;
      對話.網站ID = 取得域名(this.c);
      對話.新增訊息('user', `生成配色方案: ${描述}`);

      const prompt = await 組合提示詞(this.c, 'AI提示詞:AI提示詞:color-generator', DEFAULT_PROMPT, '配色');
      const { json, 原始回應, serverID, providerType } = await 自我修正生成(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請生成一個配色方案: ${描述}` }],
        COLOR_TASK_CONFIG,
        { 驗證器: 驗證配色結構 },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let 配色Data: Record<string, unknown> = {};
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        配色Data = json as Record<string, unknown>;
      } else {
        配色Data = { 錯誤: '回傳格式不正確', 原始回應 };
      }

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return { 配色Data, 對話ID: 儲存結果.data?.id ?? '' };
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
      await error('ColorGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
