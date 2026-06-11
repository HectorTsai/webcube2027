// 客服 Task — 限定網站內容的 RAG 問答

import { Context } from 'hono';
import { AIPoolManager } from '../pool.ts';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import AI對話 from '../../../database/models/AI對話.ts';
import AI使用記錄 from '../../../database/models/AI使用記錄.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { error } from '../../../utils/logger.ts';

export const CS_TASK_CONFIG: AITaskConfig = {
  類型: '客服',
  最低能力值: 2,
  需求能力: [AI能力標籤.文本生成, AI能力標籤.多語言],
};

const PROMPT = `你是這個網站的客服助手。
請根據以下網站內容來回答使用者的問題。

網站資訊：
{網站內容}

規則：
1. 只回答網站內容中有的資訊
2. 如果問題超出網站內容範圍，誠實告知無法回答
3. 使用友好、專業的語氣
4. 用使用者提問的語言回答`;

export class CustomerService {
  constructor(private c: Context) {}

  async 問答(問題: string, 對話ID?: string): Promise<{ 回答: string; 對話ID: string }> {
    const pool = new AIPoolManager(this.c);
    const 開始時間 = Date.now();

    try {
      let 對話: AI對話;
      if (對話ID) {
        const 查詢結果 = await 資料池.查詢單一<AI對話>(對話ID);
        if (!查詢結果.success || !查詢結果.data) throw new Error('對話不存在');
        對話 = 查詢結果.data;
      } else {
        對話 = new AI對話();
        對話.類型 = '客服';
        對話.標題 = `客服: ${問題.slice(0, 30)}...`;
        對話.網站ID = this.c.get('host') as string;
      }

      對話.新增訊息('user', 問題);

      const 網站內容 = await this.取得網站內容();
      const prompt = PROMPT.replace('{網站內容}', 網站內容);

      const 歷史 = 對話.對話記錄.slice(-10).map(m => ({
        角色: m.角色 as 'user' | 'assistant', 內容: m.內容,
      }));

      const { 回應, serverID, providerType } = await pool.聊天(
        prompt, 歷史, CS_TASK_CONFIG, { maxTokens: 1024, temperature: 0.5 }
      );

      對話.新增訊息('assistant', 回應.內容);
      對話.摘要 = 問題.slice(0, 100);

      const 儲存結果 = await 資料池.創建或更新<AI對話>('AI對話', 對話.toJSON());
      await this.記錄使用(serverID, providerType, 回應, 開始時間, true);

      return { 回答: 回應.內容, 對話ID: 儲存結果.data?.id ?? '' };
    } catch (err) {
      await this.記錄使用('error', 'error', { 內容: '', token數: 0, 耗時毫秒: 0 }, 開始時間, false);
      throw err;
    }
  }

  private async 取得網站內容(): Promise<string> {
    try {
      const 頁面結果 = await 資料池.查詢列表('頁面', 20, 0);
      if (!頁面結果.success || !頁面結果.data) return '（尚無頁面內容）';

      const pages = 頁面結果.data as unknown as Array<Record<string, unknown>>;
      const summaries = pages.map(p => {
        const 標題 = (p.標題 as Record<string, string>) || {};
        const 路徑 = p.路徑 as string || '';
        const 內容 = p.內容 as Record<string, unknown> || {};
         return `- [${路徑}] ${標題['zh-tw'] || ''}: ${JSON.stringify(內容).slice(0, 200)}`;
      });
      return summaries.join('\n');
    } catch { return '（無法取得網站內容）'; }
  }

  private async 記錄使用(serverID: string, providerType: string, 回應: { 內容: string; token數: number; 耗時毫秒: number }, 開始時間: number, 成功: boolean) {
    try {
      const 記錄 = new AI使用記錄();
      記錄.網站ID = this.c.get('host') as string;
      記錄.使用類型 = '客服';
      記錄.provider = providerType;
      記錄.serverID = serverID;
      記錄.成功 = 成功;
      記錄.耗時毫秒 = 回應.耗時毫秒 || (Date.now() - 開始時間);
      記錄.token數 = 回應.token數;
      await 資料池.創建或更新<AI使用記錄>('AI使用記錄', 記錄.toJSON());
    } catch (err) {
      await error('CustomerService', `記錄使用失敗: ${err}`);
    }
  }
}
