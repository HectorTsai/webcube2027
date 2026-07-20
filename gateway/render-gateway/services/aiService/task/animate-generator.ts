// 動畫生成 Task — 與 AI 對話生成新的動畫特效配置（animate.css class 映射）
//
// 動畫 = 語義鍵位 → Animate.css class 的對照字典
// 每個鍵位代表一個 UI 交互場景（下拉選單、抽屜、視窗、折疊面板、吐司訊息）

import { 取得域名 } from '../../../services/index.ts';
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 自我修正生成 } from '../../../utils/自我修正.ts';
import { 驗證動畫結構 } from '../../../utils/結構驗證.ts';
import { 組合提示詞 } from '../../../utils/提示詞組合器.ts';

export const ANIMATE_TASK_CONFIG: AITaskConfig = {
  類型: '動畫生成',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的動畫特效生成專家。
動畫配置定義了網站的交互動畫效果，將 UI 場景（下拉選單、抽屜、視窗等）映射到 Animate.css 動畫類名。

可用 Animate.css 類名參考：
- 進入動畫：animate__fadeIn / animate__fadeInDown / animate__fadeInUp / animate__fadeInLeft / animate__fadeInRight
- 退出動畫：animate__fadeOut / animate__fadeOutDown / animate__fadeOutUp / animate__fadeOutLeft / animate__fadeOutRight
- 滑入動畫：animate__slideInDown / animate__slideInUp / animate__slideInLeft / animate__slideInRight
- 滑出動畫：animate__slideOutDown / animate__slideOutUp / animate__slideOutLeft / animate__slideOutRight
- 縮放動畫：animate__zoomIn / animate__zoomOut
- 彈跳動畫：animate__bounceIn / animate__bounceOut
- 回彈動畫：animate__backInDown / animate__backInUp / animate__backInLeft / animate__backInRight
- 翻轉動畫：animate__flipInX / animate__flipInY
- 注意動畫：animate__shakeX / animate__shakeY / animate__headShake / animate__swing

每個動畫值可選加前綴 animate_in（適用於 @click 切換的 Alpine.js 場景）。

回傳格式：
{
  "名稱": {"zh-tw": "輕柔彈跳", "en": "Gentle Bounce"},
  "描述": {"zh-tw": "以輕柔彈跳為主的活潑動畫組合", "en": "Playful bounce-based animation set"},
  "配置": {
    "下拉選單:開": "animate_in animate__fadeIn",
    "下拉選單:關": "animate_in animate__fadeOut",
    "抽屜:上:開": "animate__slideInDown",
    "抽屜:上:關": "animate__slideOutUp",
    "抽屜:下:開": "animate__slideInUp",
    "抽屜:下:關": "animate__slideOutDown",
    "抽屜:左:開": "animate__slideInLeft",
    "抽屜:左:關": "animate__slideOutLeft",
    "抽屜:右:開": "animate__slideInRight",
    "抽屜:右:關": "animate__slideOutRight",
    "視窗:開": "animate__zoomIn",
    "視窗:關": "animate__zoomOut",
    "彈出:開": "animate__fadeIn",
    "彈出:關": "animate__fadeOut",
    "折疊面板:開": "animate_in animate__slideInDown",
    "折疊面板:關": "animate_in animate__slideOutUp",
    "吐司訊息:進場": "animate_in animate__backInRight",
    "吐司訊息:出場": "animate_in animate__fadeOutRight"
  }
}

任務規則：
1. 「配置」中的所有鍵位必須包含（共 17 個語義場景），不可缺漏
2. 進入/開合動畫選用 animate__*In* 系列；退出/關閉動畫選用 animate__*Out* 系列
3. 方向性動畫需一致（如「抽屜:上:開」向上滑入、「抽屜:上:關」向上滑出）
4. 使用 animate_in 前綴的只適用於 @click 切換的 Alpine.js 場景
5. 動畫風格要有一致性（全部輕柔型 or 全部彈跳型 or 全部滑入型）

具體規範請參考下方的設計規則。`;

export class AnimateGenerator {
  constructor(private c: Context) {}

  async 生成動畫(描述: string): Promise<{ 動畫Data: Record<string, unknown>; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = '佈景主題生成';
      對話.標題 = `動畫: ${描述.slice(0, 30)}...`;
      對話.網站ID = 取得域名(this.c);
      對話.新增訊息('user', `生成動畫特效配置: ${描述}`);

      const prompt = await 組合提示詞(this.c, 'AI提示詞:AI提示詞:animate-generator', DEFAULT_PROMPT, '佈景主題');
      const { json, 原始回應, serverID, providerType } = await 自我修正生成(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請生成一個動畫特效配置: ${描述}` }],
        ANIMATE_TASK_CONFIG,
        { 驗證器: 驗證動畫結構 },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let 動畫Data: Record<string, unknown> = {};
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        動畫Data = json as Record<string, unknown>;
      } else {
        動畫Data = { 錯誤: '回傳格式不正確', 原始回應 };
      }

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return { 動畫Data, 對話ID: 儲存結果.data?.id ?? '' };
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
      await error('AnimateGenerator', `記錄使用失敗: ${err}`);
    }
  }
}
