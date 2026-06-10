// 頁面生成 Task — 與 AI 對話生成頁面內容與 Cube 組合

import { Context } from 'hono';
import { AIPoolManager } from '../pool.ts';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 三層查詢管理器 } from '../../../database/core/three-tier-query.ts';
import { error } from '../../../utils/logger.ts';

export const PAGE_TASK_CONFIG: AITaskConfig = {
  類型: '頁面生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.代碼生成, AI能力標籤.結構化輸出],
};

const PROMPT = `你是 webcube 平台的頁面生成專家。
你的任務是根據使用者需求，生成網頁內容並組合成方塊(Cube)結構。

網站使用以下模型：
- 頁面結構: { 路徑: string, 標題: MultilingualString, 內容: any, 方塊: string }
- 方塊(Cube): { from: "div"|"span"|... | "方塊:方塊:id", className: string, style: object, args: object, children: Cube[] }

規則：
1. 內容欄位直接存你要顯示的內容（文字、列表等）
2. 方塊欄位是可選的，指向預定義方塊 ID
3. 如果方塊欄位為空，則由 renderer 使用預設元件渲染內容
4. 回傳 JSON：{ 標題: { "zh-tw": "", en: "" }, 內容: {}, 建議路徑: "/..." }
5. 內容中的方塊結構應為 Cube JSON 陣列
6. 多國語言內容同時提供 zh-tw 和 en`;

export class PageGenerator {
  constructor(private c: Context) {}

  async 生成頁面(描述: string, 語言 = 'zh-tw'): Promise<{ 頁面Data: Record<string, unknown>; 對話ID: string }> {
    const pool = new AIPoolManager(this.c);
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '頁面生成';
      對話.標題 = `頁面生成: ${描述.slice(0, 30)}...`;
      對話.網站ID = this.c.get('tenant') as string;
      對話.新增訊息('user', 描述);

      const { 回應, serverID, providerType } = await pool.聊天(
        PROMPT,
        [{ 角色: 'user', 內容: `使用者需求（語言: ${語言}）:\n${描述}` }],
        PAGE_TASK_CONFIG,
        { maxTokens: 2048, temperature: 0.7 }
      );

      對話.新增訊息('assistant', 回應.內容);

      let 頁面Data: Record<string, unknown> = {};
      const jsonMatch = 回應.內容.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { 頁面Data = JSON.parse(jsonMatch[0]); } catch { 頁面Data = { 原始回應: 回應.內容 }; }
      }

      對話.摘要 = 回應.內容.slice(0, 100);
      const 儲存結果 = await 三層查詢管理器.創建或更新<AI對話>(this.c, 'AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, 回應, 開始時間, true);

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
    const pool = new AIPoolManager(this.c);
    const 開始時間 = Date.now();

    const 查詢結果 = await 三層查詢管理器.查詢單一<AI對話>(this.c, 對話ID);
    if (!查詢結果.success || !查詢結果.data) throw new Error('對話不存在');

    const 對話 = 查詢結果.data;
    對話.新增訊息('user', 訊息);

    const 歷史 = 對話.對話記錄.slice(-10).map(m => ({
      角色: m.角色 as 'user' | 'assistant', 內容: m.內容,
    }));

    const { 回應, serverID, providerType } = await pool.聊天(
      PROMPT, 歷史, PAGE_TASK_CONFIG, { maxTokens: 2048, temperature: 0.7 }
    );

    對話.新增訊息('assistant', 回應.內容);
    await 三層查詢管理器.創建或更新<AI對話>(this.c, 'AI對話', 對話.toJSON());
    await this.記錄使用(serverID, providerType, 回應, 開始時間, true);

    let 頁面Data: Record<string, unknown> | undefined;
    const jsonMatch = 回應.內容.match(/\{[\s\S]*\}/);
    if (jsonMatch) { try { 頁面Data = JSON.parse(jsonMatch[0]); } catch { /* 純文字對話 */ } }

    return { 回應內容: 回應.內容, 頁面Data };
  }

  private async 記錄使用(serverID: string, providerType: string, 回應: { 內容: string; token數: number; 耗時毫秒: number }, 開始時間: number, 成功: boolean) {
    try {
      const 記錄 = new AI使用記錄();
      記錄.網站ID = this.c.get('tenant') as string;
      記錄.使用類型 = '頁面生成';
      記錄.provider = providerType;
      記錄.serverID = serverID;
      記錄.成功 = 成功;
      記錄.耗時毫秒 = 回應.耗時毫秒 || (Date.now() - 開始時間);
      記錄.token數 = 回應.token數;
      await 三層查詢管理器.創建或更新<AI使用記錄>(this.c, 'AI使用記錄', 記錄.toJSON());
    } catch (err) {
      await error('PageGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
