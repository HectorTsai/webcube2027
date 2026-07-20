// Cube 升級 Task — AI 自動升級舊版本的方塊到最新規格
import { Context } from 'hono';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import { 資料池 } from '../../../database/資料池.ts';
import { 安全過濾Cube } from '../../../utils/安全過濾器.ts';
import { 聊天並解析JSON } from '../../../utils/AI重試.ts';
import { 載入提示詞 } from './提示詞載入器.ts';
import 方塊 from '../../../database/models/方塊.ts';
import { info, error } from '../../../utils/logger.ts';

export const UPGRADE_TASK_CONFIG: AITaskConfig = {
  類型: '方塊升級',
  最低能力值: 5,
  需求能力: [AI能力標籤.代碼生成, AI能力標籤.文本生成, AI能力標籤.結構化輸出],
};

const DEFAULT_UPGRADE_PROMPT = `你是 webcube 平台的方塊(Cube)升級專家。
你的任務是升級舊版本的方塊到最新規格。

【當前方塊】
{目前方塊狀態}

【當前版本】
當前方塊版本: {目前版本}
最新規格版本: 2

【升級要求】
1. 將方塊升級到最新規格版本 2
2. 優化 UnoCSS 樣式，移除冗餘的 class
3. 檢查並修復任何潛在的安全問題
4. 保持原有功能不變的前提下，簡化結構
5. 確保符合最新的方塊 JSON schema 規範
6. 更新 version 欄位為 2
7. last_reviewed_at 欄位將由系統自動設定

【規格說明】
方塊是資料驅動的 UI 元件，標準 JSON 結構包含：
- from: HTML 標籤或自訂元件名稱
- className: UnoCSS 樣式類別
- style: 內嵌樣式物件
- args: 可接受參數定義
- alpine: Alpine.js 狀態設定
- on: 事件綁定
- slots: 具名插槽
- children: 子元件陣列
- wrap, wrapChild: 包裹層定義
- prepend, append: 前後綴元件
- version: 版本號（本次升級到 2）
- 已檢驗: 完整性雜湊（系統自動處理）
- last_reviewed_at: 最後審查時間（系統自動處理）

【回傳格式】
請只回傳升級後的完整 JSON 物件，不要包含任何 Markdown 標記或解釋文字。
確保回傳的是單一 JSON 物件，不是陣列。`;

const LATEST_VERSION = 2;

export class CubeUpgrader {
  constructor(private c: Context) {}

  /**
   * 掃描所有需要升級的方塊，逐一送 AI 升級
   * 升級通過 → 更新 JSON、更新版本、記錄審查時間
   * 回傳升級統計
   */
  async 升級舊方塊(): Promise<{
    總數: number;
    升級成功: number;
    升級失敗: number;
    跳過: number;
    詳細: Array<{ id: string; 名稱: string; 舊版本: number; 新版本: number; 結果: string }>;
  }> {
    const 結果 = await 資料池.查詢列表<方塊>('方塊', 100, 0);
    if (!結果.success || !結果.data) {
      return { 總數: 0, 升級成功: 0, 升級失敗: 0, 跳過: 0, 詳細: [] };
    }

    // 只篩選版本小於最新版本的方塊
    const 需升級方塊 = 結果.data.filter((b) => (b.version || 1) < LATEST_VERSION);
    const 統計 = { 
      總數: 需升級方塊.length, 
      升級成功: 0, 
      升級失敗: 0, 
      跳過: 0, 
      詳細: [] as Array<{ id: string; 名稱: string; 舊版本: number; 新版本: number; 結果: string }> 
    };

    if (統計.總數 === 0) {
      await info('CubeUpgrader', '沒有需要升級的方塊');
      return { ...統計, 詳細: [] };
    }

    await info('CubeUpgrader', `開始升級 ${統計.總數} 個舊版本方塊（目標版本: ${LATEST_VERSION}）`);

    for (const 方塊 of 需升級方塊) {
      try {
        const 舊版本 = 方塊.version || 1;
        const 方塊JSON = 方塊.toJSON();

        // 動態把「目前方塊的 JSON」和「版本資訊」塞進提示詞中
        const 帶有狀態的提示詞 = DEFAULT_UPGRADE_PROMPT
          .replace('{目前方塊狀態}', JSON.stringify(方塊JSON, null, 2))
          .replace('{目前版本}', 舊版本.toString());

        const prompt = await 載入提示詞(this.c, 'AI提示詞:AI提示詞:cube-upgrader', 帶有狀態的提示詞);
        
        const { json, 原始回應 } = await 聊天並解析JSON(
          this.c,
          prompt,
          [{ 角色: 'user', 內容: `請升級這個方塊到版本 ${LATEST_VERSION}` }],
          UPGRADE_TASK_CONFIG,
          { 重試提示: '請只回傳升級後的完整 JSON 物件，不要包含任何其他文字' },
        );

        // 安全過濾
        const 升級後JSON = 安全過濾Cube(json as Record<string, unknown>);

        // 更新方塊
        await 資料池.創建或更新('方塊', {
          ...升級後JSON,
          id: 方塊.id,
          version: LATEST_VERSION,
          last_reviewed_at: new Date().toISOString(),
        });

        統計.升級成功++;
        統計.詳細.push({ 
          id: 方塊.id, 
          名稱: 方塊.名稱?.toString() || '', 
          舊版本, 
          新版本: LATEST_VERSION, 
          結果: '升級成功' 
        });
        await info('CubeUpgrader', `方塊 ${方塊.id} 升級成功: v${舊版本} → v${LATEST_VERSION}`);
      } catch (err) {
        統計.升級失敗++;
        統計.詳細.push({
          id: 方塊.id,
          名稱: 方塊.名稱?.toString() || '',
          舊版本: 方塊.version || 1,
          新版本: LATEST_VERSION,
          結果: `失敗: ${err}`,
        });
        await error('CubeUpgrader', `升級方塊 ${方塊.id} 時發生錯誤: ${err}`);
      }
    }

    await info('CubeUpgrader', `升級完成: 成功=${統計.升級成功}, 失敗=${統計.升級失敗}, 跳過=${統計.跳過}`);
    return 統計;
  }
}
