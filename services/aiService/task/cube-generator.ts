// Cube 生成 Task — 與 AI 對話生成新的方塊(Cube)定義

import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 安全過濾Cube } from '../../../utils/安全過濾器.ts';
import { 聊天並解析JSON } from '../../../utils/AI重試.ts';

export const CUBE_TASK_CONFIG: AITaskConfig = {
  類型: 'Cube生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.代碼生成, AI能力標籤.結構化輸出],
};

const PROMPT = `你是 webcube 平台的方塊(Cube)生成專家。
方塊是資料驅動的 UI 元件，每個方塊是一個 JSON 物件。
欄位說明：
- from: HTML 標籤 ("div"|"span"|"p"|"img"|"button"|"a"|"ul"|"li"|...) 或方塊 ID ("方塊:方塊:xxx")
- className: CSS class 字串（可使用 Tailwind/UnoCSS class）
- style: inline style 物件
- args: 屬性物件 (如 { href: "...", src: "..." })
- children: 子方塊陣列（支援遞迴，上限 10 層）
- content: 文字內容（與 children 互斥）

規則：
1. 只回傳 JSON 陣列: [{ from: "div", className: "p-4 bg-white", children: [...] }]
2. 使用 Tailwind/UnoCSS class 做排版
3. 支援 RWD 設計
4. 內容使用 MultilingualString 格式: { "zh-tw": "...", "en": "..." }`;

export class CubeGenerator {
  constructor(private c: Context) {}

  async 生成Cube(描述: string, 儲存目標: '系統' | '網站' = '網站'): Promise<{ cubeData: Record<string, unknown>[]; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = 'Cube生成';
      對話.標題 = `Cube: ${描述.slice(0, 30)}...`;
      對話.網站ID = this.c.get('host') as string;
      對話.新增訊息('user', `生成方塊（儲存於${儲存目標}）: ${描述}`);

      // 使用自動重試機制：JSON 解析失敗時自動重試一次
      const { json, 原始回應, serverID, providerType } = await 聊天並解析JSON(
        this.c,
        PROMPT,
        [{ 角色: 'user', 內容: `請設計一個方塊元件: ${描述}` }],
        CUBE_TASK_CONFIG,
        { 重試提示: '請只回傳 JSON 陣列，不要包含任何其他文字' },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let cubeData: Record<string, unknown>[] = Array.isArray(json) ? json : [{ 原始回應 }];

      // L1 安全過濾：移除 script、危險 URI、inline 事件
      cubeData = cubeData.map((cube) => 安全過濾Cube(cube)) as Record<string, unknown>[];

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return { cubeData, 對話ID: 儲存結果.data?.id ?? '' };
    } catch (err) {
      await this.記錄使用('error', 'error', { 內容: '', token數: 0, 耗時毫秒: 0 }, 開始時間, false);
      throw err;
    }
  }

  private async 記錄使用(serverID: string, providerType: string, 回應: { 內容: string; token數: number; 耗時毫秒: number }, 開始時間: number, 成功: boolean) {
    try {
      const 記錄 = new AI使用記錄();
      記錄.網站ID = this.c.get('host') as string;
      記錄.使用類型 = 'Cube生成';
      記錄.provider = providerType;
      記錄.serverID = serverID;
      記錄.成功 = 成功;
      記錄.耗時毫秒 = 回應.耗時毫秒 || (Date.now() - 開始時間);
      記錄.token數 = 回應.token數;
      await 資料池.創建或更新<AI使用記錄>('AI使用記錄', 記錄.toJSON());
    } catch (err) {
      await error('CubeGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
