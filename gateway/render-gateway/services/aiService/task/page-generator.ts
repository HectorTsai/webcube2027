// 頁面生成 Task — 與 AI 對話生成頁面內容與 Cube 組合
// 內建自我修正迴圈：AI 產生 JSON 後自動驗證結構，發現問題自動修正（最多 3 輪）

import { 取得域名 } from '../../../services/index.ts';
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 自我修正生成 } from '../../../utils/自我修正.ts';
import { 驗證頁面結構 } from '../../../utils/結構驗證.ts';
import { 組合提示詞 } from '../../../utils/提示詞組合器.ts';

export const PAGE_TASK_CONFIG: AITaskConfig = {
  類型: '頁面生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.代碼生成, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的頁面生成專家。
你的任務是根據使用者需求，生成網頁頁面內容並組合成方塊(Cube)結構。

頁面 JSON 格式：{ 標題: MultilingualString, 內容: PageContent, 建議路徑?: string }
PageContent 格式：{ direction: "col"|"row", gap, padding?, children: PageChild[] }
PageChild 格式：{ from: "方塊ID"|"原生標籤", ...args }

任務規則：
1. 回傳完整頁面 JSON，包含標題、內容、建議路徑
2. 優先使用系統既有方塊（方塊:方塊:容器、方塊:方塊:卡片、方塊:方塊:導覽列、方塊:方塊:頁尾 等）
3. Card 方塊的內容必須放在 children 中（不要用頂層 title/content 屬性）
4. 確保 children 中每個項目都有 from 欄位，且 children 不可為空陣列

具體的頁面結構規範、方塊用法、多國語言格式、UnoCSS 禁令，請參考下方的設計規則。`;

export class PageGenerator {
  constructor(private c: Context) {}

  async 生成頁面(描述: string, 語言 = 'zh-tw'): Promise<{ 頁面Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '頁面生成';
      對話.標題 = `頁面生成: ${描述.slice(0, 30)}...`;
      對話.網站ID = 取得域名(this.c);
      對話.新增訊息('user', 描述);

      const prompt = await 組合提示詞(this.c, 'AI提示詞:AI提示詞:page-generator', DEFAULT_PROMPT, '頁面');
      const { json, 原始回應, serverID, providerType } = await 自我修正生成(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `使用者需求（語言: ${語言}）:\n${描述}` }],
        PAGE_TASK_CONFIG,
        { 驗證器: 驗證頁面結構 },
      );

      對話.新增訊息('assistant', 原始回應);

      let 頁面Data: Record<string, unknown> = {};
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        頁面Data = json as Record<string, unknown>;
      } else {
        頁面Data = { 原始回應 };
      }

      對話.摘要 = 原始回應.slice(0, 100);
      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return {
        頁面Data: { ...頁面Data, 對話ID: 儲存結果.data?.id ?? '' },
        對話ID: 儲存結果.data?.id ?? '',
      };
    } catch (err) {
      await this.記錄使用('error', 'error', { 內容: '', token數: 0, 耗時毫秒: 0 }, 開始時間, false);
      throw err;
    }
  }

  async 繼續對話(對話ID: string, 訊息: string): Promise<{ 回應內容: string; 頁面Data?: Record<string, unknown> }> {
    const 開始時間 = Date.now();

    const 查詢結果 = await 資料池.查詢單一<AI對話>(對話ID);
    if (!查詢結果.success || !查詢結果.data) throw new Error('對話不存在');

    const 對話 = 查詢結果.data;
    對話.新增訊息('user', 訊息);

    const 歷史 = 對話.對話記錄.slice(-10).map(m => ({
      角色: m.角色 as 'user' | 'assistant', 內容: m.內容,
    }));

    const prompt = await 組合提示詞(this.c, 'AI提示詞:AI提示詞:page-generator', DEFAULT_PROMPT, '頁面');
    const { json, 原始回應, serverID, providerType } = await 自我修正生成(
      this.c,
      prompt,
      歷史,
      PAGE_TASK_CONFIG,
      { 驗證器: 驗證頁面結構 },
    );

    對話.新增訊息('assistant', 原始回應);
    await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
    await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

    let 頁面Data: Record<string, unknown> | undefined;
    if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
      頁面Data = json as Record<string, unknown>;
    }

    return { 回應內容: 原始回應, 頁面Data };
  }

  private async 記錄使用(serverID: string, providerType: string, 回應: { 內容: string; token數: number; 耗時毫秒: number }, 開始時間: number, 成功: boolean) {
    try {
      const 記錄 = new AI使用記錄();
      記錄.網站ID = 取得域名(this.c);
      記錄.使用類型 = '頁面生成';
      記錄.provider = providerType;
      記錄.serverID = serverID;
      記錄.成功 = 成功;
      記錄.耗時毫秒 = 回應.耗時毫秒 || (Date.now() - 開始時間);
      記錄.token數 = 回應.token數;
      await 資料池.創建或更新<AI使用記錄>('AI使用記錄', 記錄.toJSON());
    } catch (err) {
      await error('PageGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
