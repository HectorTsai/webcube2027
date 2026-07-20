// 骨架生成 Task — 與 AI 對話生成新的頁面骨架（佈局 Token 集）
//
// 骨架 = 佈局模板 + 一組幾何 CSS Token（圓角/間距/字型/行高/邊框/圖示/圖片尺寸）
// Token 使用 CSS 單位（rem/px），對應 TailwindCSS/DaisyUI 變數體系

import { 取得域名 } from '../../../services/index.ts';
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 自我修正生成 } from '../../../utils/自我修正.ts';
import { 驗證骨架結構 } from '../../../utils/結構驗證.ts';
import { 組合提示詞 } from '../../../utils/提示詞組合器.ts';

export const SKELETON_TASK_CONFIG: AITaskConfig = {
  類型: '骨架生成',
  最低能力值: 4,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的頁面骨架生成專家。
骨架定義了網站的佈局系統與幾何 Token，控制全域的圓角、間距、字型、行高、邊框粗細、圖示尺寸與圖片尺寸。

骨架 Token 家族：
- 圓角（radius）：sm / md / lg / avatar
- 間距（spacing）：xs ~ 2xl
- 字型（font）：xs ~ 9xl
- 行高（leading）：xs ~ 9xl
- 邊框（border）：sm / md / lg
- 圖示（icon）：xs / sm / md / lg
- 圖片（image）：sm ~ 9xl

回傳格式：
{
  "名稱": {"zh-tw": "舒適閱讀", "en": "Comfortable Reading"},
  "描述": {"zh-tw": "加大字距與行高的閱讀友善骨架", "en": "Reading-friendly skeleton with generous spacing"},
  "配置": {
    "radius-sm": "0.25rem",   "radius-md": "0.5rem",
    "radius-lg": "1rem",       "radius-avatar": "999rem",
    "spacing-xs": "0.5rem",   "spacing-sm": "0.75rem",
    "spacing-md": "1rem",     "spacing-lg": "1.5rem",
    "spacing-xl": "2rem",     "spacing-2xl": "3rem",
    "font-xs": "0.75rem",     "font-sm": "0.875rem",
    "font-md": "1rem",        "font-lg": "1.125rem",
    "font-xl": "1.25rem",     "font-2xl": "1.5rem",
    "font-3xl": "1.875rem",   "font-4xl": "2.25rem",
    "font-5xl": "3rem",       "font-6xl": "3.75rem",
    "font-7xl": "4.5rem",     "font-8xl": "6rem",
    "font-9xl": "8rem",
    "leading-xs": "1rem",     "leading-sm": "1.25rem",
    "leading-md": "1.5rem",   "leading-lg": "1.75rem",
    "leading-xl": "2rem",     "leading-2xl": "2.25rem",
    "leading-3xl": "2.5rem",  "leading-4xl": "3rem",
    "leading-5xl": "3.5rem",  "leading-6xl": "4rem",
    "leading-7xl": "5rem",    "leading-8xl": "6.5rem",
    "leading-9xl": "8.5rem",
    "border-sm": "1px",       "border-md": "1.5px",
    "border-lg": "3px",
    "icon-xs": "12px",        "icon-sm": "16px",
    "icon-md": "24px",        "icon-lg": "32px",
    "image-sm": "48px",       "image-md": "96px",
    "image-lg": "160px",      "image-xl": "256px",
    "image-2xl": "384px",     "image-3xl": "512px",
    "image-4xl": "640px",     "image-5xl": "768px",
    "image-6xl": "896px",     "image-7xl": "960px",
    "image-8xl": "992px",     "image-9xl": "1024px"
  }
}

任務規則：
1. 所有 Token 使用 CSS 單位（rem 或 px），不可用 em/vw/%
2. 字型 Token 需涵蓋 xs ~ 9xl 共 9 級（等比遞增）
3. 行高 Token 需對應字型 Token 的級別
4. 圓角 Token 需覆蓋 sm / md / lg / avatar 四級
5. 邊框 Token 用整數像素（1px / 2px / 3px）
6. 骨架風格需與佈局系統協調（緊湊型用較小間距，大氣型用較大間距）

具體規範請參考下方的設計規則。`;

export class SkeletonGenerator {
  constructor(private c: Context) {}

  async 生成骨架(描述: string): Promise<{ 骨架Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '佈景主題生成';
      對話.標題 = `骨架: ${描述.slice(0, 30)}...`;
      對話.網站ID = 取得域名(this.c);
      對話.新增訊息('user', `生成頁面骨架: ${描述}`);

      const prompt = await 組合提示詞(this.c, 'AI提示詞:AI提示詞:skeleton-generator', DEFAULT_PROMPT, '佈景主題');
      const { json, 原始回應, serverID, providerType } = await 自我修正生成(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請生成一個頁面骨架: ${描述}` }],
        SKELETON_TASK_CONFIG,
        { 驗證器: 驗證骨架結構 },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let 骨架Data: Record<string, unknown> = {};
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        骨架Data = json as Record<string, unknown>;
      } else {
        骨架Data = { 錯誤: '回傳格式不正確', 原始回應 };
      }

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return { 骨架Data, 對話ID: 儲存結果.data?.id ?? '' };
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
      await error('SkeletonGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
