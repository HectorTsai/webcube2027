// 風格生成 Task — 與 AI 對話生成新的風格模組

import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 聊天並解析JSON } from '../../../utils/AI重試.ts';
import { 載入提示詞 } from './提示詞載入器.ts';

export const STYLE_TASK_CONFIG: AITaskConfig = {
  類型: '風格生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.CSS與設計, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的 CSS 風格生成專家。
風格是一組 CSS 變數組合拳，儲存在「配置」物件中。

支援的 CSS 變數 key（但不限於）：
- gradient: CSS 漸層字串
- pattern: 圖示 ID (如 "圖示:圖示:xxx")
- pattern-size: 圖案尺寸
- bg-image-compose: 背景組合 var() 變數
- border: 邊框樣式
- shadow: 陰影樣式
- text-color: 文字顏色
- hover-bg: 懸停背景
- hover-shadow: 懸停陰影

規則：
1. 只回傳 JSON：{ "名稱": {"zh-tw":"", en:""}, "描述": {"zh-tw":"", en:""}, "配置": { "gradient":"..." } }
2. 顏色使用 oklch() 格式
3. 風格要符合使用者描述的視覺效果`;

export class StyleGenerator {
  constructor(private c: Context) {}

  async 生成風格(描述: string, 儲存目標: '系統' | '網站' = '網站'): Promise<{ 風格Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '風格生成';
      對話.標題 = `風格: ${描述.slice(0, 30)}...`;
      對話.網站ID = this.c.get('host') as string;
      對話.新增訊息('user', `生成風格（儲存於${儲存目標}）: ${描述}`);

      const prompt = await 載入提示詞(this.c, 'AI提示詞:AI提示詞:style-generator', DEFAULT_PROMPT);
      const { json, 原始回應, serverID, providerType } = await 聊天並解析JSON(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請生成一個風格: ${描述}` }],
        STYLE_TASK_CONFIG,
        { 重試提示: '請只回傳 JSON 物件，不要包含任何其他文字' },
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
      記錄.網站ID = this.c.get('host') as string;
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
