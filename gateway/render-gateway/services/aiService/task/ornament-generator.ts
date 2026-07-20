// 裝飾生成 Task — 與 AI 對話生成新的裝飾配置（角落 SVG/浮水印掛件指針）
//
// 裝飾 = 語義位置鍵位 → SVG/圖片掛件 ID 的對照字典
// 每個鍵位代表網頁上某個裝飾位置（左上角/右上角/卡片裝飾/浮水印）

import { 取得域名 } from '../../../services/index.ts';
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 自我修正生成 } from '../../../utils/自我修正.ts';
import { 驗證裝飾結構 } from '../../../utils/結構驗證.ts';
import { 組合提示詞 } from '../../../utils/提示詞組合器.ts';

export const ORNAMENT_TASK_CONFIG: AITaskConfig = {
  類型: '裝飾生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的裝飾元件生成專家。
裝飾配置定義了網站的裝飾性掛件位置，每個位置可掛載一個 SVG 或圖片。

裝飾位置鍵位：
- container-top-left / container-top-right / container-bottom-left / container-bottom-right：頁面容器的四個角落裝飾
- page-watermark：全頁浮水印
- card-ornament：卡片內部裝飾
- badge-top-left / badge-top-right：角落徽章

可用值：
- "none" — 該位置不顯示裝飾（最常見）
- "圖示:圖示:xxx" — 引用既有的圖示 SVG（如雪花、星星、節慶元素）
- "圖片:圖片:xxx" — 引用既有的圖片（如浮水印底圖）

回傳格式：
{
  "名稱": {"zh-tw": "聖誕節裝飾", "en": "Christmas Ornament"},
  "描述": {"zh-tw": "角落雪花與紅綠徽章", "en": "Snowflake corners with red-green badges"},
  "配置": {
    "container-top-left": "none",
    "container-top-right": "none",
    "container-bottom-left": "none",
    "container-bottom-right": "none",
    "page-watermark": "none",
    "card-ornament": "none",
    "badge-top-left": "none",
    "badge-top-right": "none"
  }
}

任務規則：
1. 所有 8 個位置鍵位必須存在於「配置」中，不可缺漏
2. 不需要裝飾的位置設為 "none"
3. 節慶/特定場合型裝飾可用既有圖示 ID 掛入（如聖誕節用雪花圖示）
4. 商業/專業型主題通常全部設為 "none"（乾淨無裝飾）
5. 裝飾名稱要反映場合（節慶、企業、極簡等）

具體規範請參考下方的設計規則。`;

export class OrnamentGenerator {
  constructor(private c: Context) {}

  async 生成裝飾(描述: string): Promise<{ 裝飾Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '佈景主題生成';
      對話.標題 = `裝飾: ${描述.slice(0, 30)}...`;
      對話.網站ID = 取得域名(this.c);
      對話.新增訊息('user', `生成裝飾配置: ${描述}`);

      const prompt = await 組合提示詞(this.c, 'AI提示詞:AI提示詞:ornament-generator', DEFAULT_PROMPT, '佈景主題');
      const { json, 原始回應, serverID, providerType } = await 自我修正生成(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請生成一個裝飾配置: ${描述}` }],
        ORNAMENT_TASK_CONFIG,
        { 驗證器: 驗證裝飾結構 },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let 裝飾Data: Record<string, unknown> = {};
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        裝飾Data = json as Record<string, unknown>;
      } else {
        裝飾Data = { 錯誤: '回傳格式不正確', 原始回應 };
      }

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return { 裝飾Data, 對話ID: 儲存結果.data?.id ?? '' };
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
      await error('OrnamentGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
