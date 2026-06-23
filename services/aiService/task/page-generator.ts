// 頁面生成 Task — 與 AI 對話生成頁面內容與 Cube 組合

import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 聊天並解析JSON } from '../../../utils/AI重試.ts';
import { 載入提示詞 } from './提示詞載入器.ts';

export const PAGE_TASK_CONFIG: AITaskConfig = {
  類型: '頁面生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.代碼生成, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的頁面生成專家。
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
6. 多國語言內容同時提供 zh-tw 和 en

═══ Slot / repeat 作用域規則 ═══
Seed JSON 透過 children 的 slot 屬性映射到具名 slot，並用 repeat 展開陣列資料：
1. 頂層 children 中帶 "slot": "xxx" 的項目會自動注入對應 slot 的預設內容。
2. 無 "slot" 屬性的 children 會直接渲染在方塊內部（與 slot 平行）。
3. 若使用者傳入 <Slot name="xxx"> 外部內容，會覆蓋 seed 的 slot 預設值。
4. 使用 "repeat": "{items}" 搭配傳入 items 陣列 props，自動展開 N 個元素。
5. 例：<Cube from="方塊:方塊:主選單" items={["首頁","關於","服務"]} /> — repeat 自動展開

正確範例（以主選單為例）：
在基礎佈局中：
<Cube from="方塊:方塊:基礎佈局" context={c} /> — items 由 mergedArgs 從 $api 取得，repeat 自動展開

在測試頁中：
<Cube from="方塊:方塊:主選單" context={c} color="primary" items={["首頁","關於","服務"]} />`;

export class PageGenerator {
  constructor(private c: Context) {}

  async 生成頁面(描述: string, 語言 = 'zh-tw'): Promise<{ 頁面Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '頁面生成';
      對話.標題 = `頁面生成: ${描述.slice(0, 30)}...`;
      對話.網站ID = this.c.get('host') as string;
      對話.新增訊息('user', 描述);

      const prompt = await 載入提示詞(this.c, 'AI提示詞:AI提示詞:page-generator', DEFAULT_PROMPT);
      const { json, 原始回應, serverID, providerType } = await 聊天並解析JSON(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `使用者需求（語言: ${語言}）:\n${描述}` }],
        PAGE_TASK_CONFIG,
        { 重試提示: '請只回傳 JSON 物件，不要包含任何其他文字' },
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

    const prompt = await 載入提示詞(this.c, 'AI提示詞:AI提示詞:page-generator', DEFAULT_PROMPT);
    const { json, 原始回應, serverID, providerType } = await 聊天並解析JSON(
      this.c,
      prompt,
      歷史,
      PAGE_TASK_CONFIG,
      { 重試提示: '請只回傳 JSON 物件，不要包含任何其他文字' },
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
      記錄.網站ID = this.c.get('host') as string;
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
