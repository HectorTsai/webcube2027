// Cube 生成 Task — Agent 架構：支援初次生成 + 多輪連續對話修改
// 管理員可以像 Cursor/Trae 一樣反覆對話調整方塊外觀，AI 記住歷史並精準修改

import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';
import { 安全過濾Cube } from '../../../utils/安全過濾器.ts';
import { 聊天並解析JSON } from '../../../utils/AI重試.ts';
import { 載入提示詞 } from './提示詞載入器.ts';

export const CUBE_TASK_CONFIG: AITaskConfig = {
  類型: 'Cube生成與對話修改',
  最低能力值: 3,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.代碼生成, AI能力標籤.結構化輸出],
};

const DEFAULT_PROMPT = `你是 webcube 平台的方塊(Cube)優化專家。
方塊是資料驅動的 UI 元件，每個方塊是一個 JSON 物件。

【當前狀態】
目前該方塊在資料庫中的最新 JSON 結構如下：
{目前方塊狀態}

前端技術棧：Alpine.js + UnoCSS。
管理員會對你提出修改意見。請仔細思考、分析結構，並完成修改。

規則：
1. 請審視管理員的要求，並「完整輸出修改後的新 JSON 物件」。
2. 確保只回傳標準 JSON，不要包含任何 \`\`\`json 等 Markdown 標記或解釋文字。
3. 保持其餘未修改欄位的原樣。`;

export class CubeGenerator {
  constructor(private c: Context) {}

  // ═════════════════════════════════════════════════════════════════
  //  初次生成：單次對話，不帶歷史
  // ═════════════════════════════════════════════════════════════════

  async 生成Cube(描述: string, 儲存目標: '系統' | '網站' = '網站'): Promise<{ cubeData: Record<string, unknown>[]; 對話ID: string }> {
    const 開始時間 = Date.now();

    try {
      const 對話 = new AI對話();
      對話.類型 = 'Cube生成';
      對話.標題 = `Cube: ${描述.slice(0, 30)}...`;
      對話.網站ID = this.c.get('host') as string;
      對話.新增訊息('user', `生成方塊（儲存於${儲存目標}）: ${描述}`);

      const prompt = await 載入提示詞(this.c, 'AI提示詞:AI提示詞:cube-generator', DEFAULT_PROMPT);
      const { json, 原始回應, serverID, providerType } = await 聊天並解析JSON(
        this.c,
        prompt,
        [{ 角色: 'user', 內容: `請設計一個方塊元件: ${描述}` }],
        CUBE_TASK_CONFIG,
        { 重試提示: '請只回傳 JSON 陣列，不要包含任何其他文字' },
      );

      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 原始回應.slice(0, 100);

      let cubeData: Record<string, unknown>[] = Array.isArray(json) ? json : [{ 原始回應 }];
      cubeData = cubeData.map((cube) => 安全過濾Cube(cube)) as Record<string, unknown>[];

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return { cubeData, 對話ID: 儲存結果.data?.id ?? '' };
    } catch (err) {
      await this.記錄使用('error', 'error', { 內容: '', token數: 0, 耗時毫秒: 0 }, 開始時間, false);
      throw err;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  //  核心對話修改：支援多輪連續對話，類似 Cursor/Trae 互動模式
  // ═════════════════════════════════════════════════════════════════

  async 對話修改方塊(參數: {
    管理員指令: string;
    對話ID?: string;
    方塊ID?: string;
  }): Promise<{ success: boolean; 方塊ID?: string; 對話ID?: string; 最新JSON?: Record<string, unknown> }> {
    const { 管理員指令, 對話ID, 方塊ID } = 參數;
    const 開始時間 = Date.now();

    try {
      // 1. 取得或初始化對話紀錄（多輪記憶）
      let 對話: AI對話;
      if (對話ID) {
        const 查詢對話 = await 資料池.查詢單一<AI對話>(對話ID);
        對話 = 查詢對話.data ?? new AI對話();
        if (!查詢對話.success || !查詢對話.data) {
          // 對話不存在就開新的
          對話 = new AI對話();
          對話.類型 = 'Cube生成';
          對話.網站ID = this.c.get('host') as string;
          對話.標題 = `Cube: ${管理員指令.slice(0, 30)}...`;
        }
      } else {
        對話 = new AI對話();
        對話.類型 = 'Cube生成';
        對話.網站ID = this.c.get('host') as string;
        對話.標題 = `Cube: ${管理員指令.slice(0, 30)}...`;
      }

      // 2. 取得當前方塊的最新 JSON 狀態（Context 狀態注入）
      let 目前方塊JSON: Record<string, unknown> = {};
      if (方塊ID) {
        const 查詢方塊 = await 資料池.查詢單一(方塊ID);
        if (查詢方塊.success && 查詢方塊.data) {
          目前方塊JSON = (查詢方塊.data as Record<string, unknown>);
        }
      }

      // 3. 動態把「目前方塊的 JSON」塞進基礎提示詞中
      const 帶有狀態的提示詞 = DEFAULT_PROMPT.replace(
        '{目前方塊狀態}',
        JSON.stringify(目前方塊JSON, null, 2)
      );

      const prompt = await 載入提示詞(this.c, 'AI提示詞:AI提示詞:cube-generator', 帶有狀態的提示詞);

      // 4. 把管理員新說的話推入對話紀錄
      對話.新增訊息('user', 管理員指令);

      // 轉成 聊天並解析JSON 需要的格式
      const 歷史對話陣列 = 對話.對話記錄.map((m) => ({
        角色: m.角色 as 'user' | 'assistant',
        內容: m.內容,
      }));

      // 5. 呼叫強大的連線池與重試機制
      const { json, 原始回應, serverID, providerType } = await 聊天並解析JSON(
        this.c,
        prompt,
        歷史對話陣列,
        CUBE_TASK_CONFIG,
        { 重試提示: '請只回傳合法的 JSON 物件，不要包含任何其他文字' },
      );

      // 6. 安全過濾
      let cubeData: unknown = json;
      if (Array.isArray(cubeData)) {
        cubeData = cubeData.map((item) => 安全過濾Cube(item));
      } else {
        cubeData = 安全過濾Cube(cubeData);
      }

      const 最終JSON = (Array.isArray(cubeData) ? (cubeData as unknown[])[0] : cubeData) as Record<string, unknown>;

      // 7. 將修改後的新 JSON 寫回資料庫的方塊表
      const 儲存方塊 = await 資料池.創建或更新('方塊', {
        id: 方塊ID || `方塊:方塊:${crypto.randomUUID()}`,
        ...最終JSON,
      }, this.c.get('host') as string);

      // 8. 將 AI 的回應記錄回歷史，保持記憶連續
      對話.新增訊息('assistant', 原始回應);
      對話.摘要 = 管理員指令.slice(0, 50);
      const 儲存對話 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());

      // 9. 記錄使用
      await this.記錄使用(serverID, providerType, { 內容: 原始回應, token數: 0, 耗時毫秒: Date.now() - 開始時間 }, 開始時間, true);

      return {
        success: true,
        方塊ID: 儲存方塊.data?.id,
        對話ID: 儲存對話.data?.id,
        最新JSON: 最終JSON,
      };
    } catch (err) {
      await this.記錄使用('error', 'error', { 內容: '', token數: 0, 耗時毫秒: 0 }, 開始時間, false);
      throw err;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  //  使用記錄（內部共用）
  // ═════════════════════════════════════════════════════════════════

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
