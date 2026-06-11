// 代碼審查 Task — AI 排程審查未驗證的方塊，寫入完整性雜湊
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { 計算完整性雜湊 } from '../../../utils/安全過濾器.ts';
import { 聊天並解析JSON } from '../../../utils/AI重試.ts';
import 方塊 from '../../../database/models/方塊.ts';
import { info, error } from '../../../utils/logger.ts';

export const REVIEW_TASK_CONFIG: AITaskConfig = {
  類型: '代碼審核',
  最低能力值: 3,
  需求能力: [AI能力標籤.代碼審核],
};

const REVIEW_PROMPT = `你是 webcube 平台的安全審查專家。
審查方塊(Cube) JSON 中的安全問題。

檢查項目：
1. 危險 HTML 標籤：<script>, <iframe>, <embed>, <object>, <applet>
2. 危險 URI：javascript:, data:, vbscript:, file: 等協定
3. Inline 事件處理器：onerror, onclick, onload, onmouseover 等
4. dangerouslySetInnerHTML 或類似危險 API 的使用
5. 過深的巢狀結構（超過 10 層）

回傳 JSON：
{
  "安全": true/false,
  "風險等級": "低"|"中"|"高",
  "問題": ["問題1", "問題2"],
  "建議": "修改建議"
}

如果安全，直接回傳 { "安全": true, "風險等級": "低", "問題": [], "建議": "通過" }`;

export class CodeReview {
  constructor(private c: Context) {}

  /**
   * 掃描所有未檢驗的方塊，逐一送 AI 審查
   * 審查通過 → 計算 hash → 寫入 已檢驗
   * 回傳審查統計
   */
  async 掃描未檢驗方塊(): Promise<{
    總數: number;
    通過: number;
    失敗: number;
    跳過: number;
    詳細: Array<{ id: string; 名稱: string; 結果: string }>;
  }> {
    const 結果 = await 資料池.查詢列表<方塊>('方塊', 100, 0);
    if (!結果.success || !結果.data) {
      return { 總數: 0, 通過: 0, 失敗: 0, 跳過: 0, 詳細: [] };
    }

    // 只篩選已檢驗為空的方塊
    const 未檢驗方塊 = 結果.data.filter((b) => !b.已檢驗);
    const 統計 = { 總數: 未檢驗方塊.length, 通過: 0, 失敗: 0, 跳過: 0, 詳細: [] as Array<{ id: string; 名稱: string; 結果: string }> };

    if (統計.總數 === 0) {
      await info('CodeReview', '沒有未檢驗的方塊，跳過審查');
      return { ...統計, 詳細: [] };
    }

    await info('CodeReview', `開始審查 ${統計.總數} 個未檢驗方塊`);

    for (const 方塊 of 未檢驗方塊) {
      try {
        const 方塊JSON = {
          from: 方塊.from,
          className: 方塊.className,
          style: 方塊.style,
          args: 方塊.args,
          children: 方塊.children,
          on: 方塊.on,
        };

        // 使用自動重試機制：審查回應 JSON 解析失敗時自動重試一次
        const { json } = await 聊天並解析JSON(
          this.c,
          REVIEW_PROMPT,
          [{ 角色: 'user', 內容: `審查這個方塊 JSON：\n${JSON.stringify(方塊JSON, null, 2)}` }],
          REVIEW_TASK_CONFIG,
          { 重試提示: '請只回傳 JSON 物件，不要包含任何其他文字' },
        );

        const 審查結果 = json as { 安全?: boolean; 風險等級?: string; 問題?: string[]; 建議?: string };

        if (審查結果.安全 === true) {
          // 通過：計算完整性雜湊並寫入
          const hash = await 計算完整性雜湊(方塊JSON as unknown as Record<string, unknown>);
          await 資料池.創建或更新('方塊', { ...方塊.toJSON(), 已檢驗: hash } as Record<string, unknown>);
          統計.通過++;
          統計.詳細.push({ id: 方塊.id, 名稱: 方塊.名稱?.toString() || '', 結果: '通過' });
        } else {
          // 未通過：記錄但不阻擋（只標記，等待人工處理）
          await 資料池.創建或更新('方塊', { ...方塊.toJSON(), 已檢驗: '審查失敗' } as Record<string, unknown>);
          統計.失敗++;
          統計.詳細.push({
            id: 方塊.id,
            名稱: 方塊.名稱?.toString() || '',
            結果: `失敗: ${審查結果.建議 || '未知'}`,
          });
          await error('CodeReview', `方塊 ${方塊.id} 審查失敗: ${審查結果.建議}`);
        }
      } catch (err) {
        統計.跳過++;
        統計.詳細.push({ id: 方塊.id, 名稱: '', 結果: `錯誤: ${err}` });
        await error('CodeReview', `審查方塊 ${方塊.id} 時發生錯誤: ${err}`);
      }
    }

    await info('CodeReview', `審查完成: 通過=${統計.通過}, 失敗=${統計.失敗}, 跳過=${統計.跳過}`);
    return 統計;
  }
}