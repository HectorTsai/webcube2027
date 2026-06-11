// 定時服務 — 根據資料庫中的排程記錄，用 setTimeout 鍵控執行命令
//
// 架構：
//   啟動時：資料庫初始化完成 → 定時器.排程(排程資料庫)
//   執行期：後台/API 新增排程時 → 定時器.新增排程(record, db)
//     → setTimeout 依間隔觸發
//     → 觸發時：更新最後執行 → fetch(baseUrl + record.命令) → 循環 vs 刪除
//   排程來源：從 record.host 決定
//     host=null → 系統級，固定 http://localhost:8000
//     host=域名 → 網站級，http://{host}
//
// 如何新增排程：
//   1. 寫入資料庫一筆 排程記錄（設定 命令 + host 欄位）
//   2. 呼叫 定時器.新增排程(record, db)

import 排程記錄 from '../../database/models/排程記錄.ts';
import { info, error } from '../../utils/logger.ts';

/** 排程器需要的資料庫操作介面 */
export interface 排程資料庫 {
  讀取所有排程(): Promise<排程記錄[]>;
  更新最後執行(id: string, 時間: Date): Promise<void>;
  刪除排程(id: string): Promise<void>;
}

class 定時服務 {
  private 計時器 = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * 從給定的資料庫載入排程記錄並啟動所有排程
   */
  async 排程(db: 排程資料庫): Promise<void> {
    const tasks = await db.讀取所有排程();

    let 已排程 = 0;
    let 已刪除 = 0;

    for (const record of tasks) {
      if (!record.啟用) continue;

      if (record.循環) {
        this.安排循環(db, record);
        已排程++;
      } else {
        if (record.最後執行.getTime() === 0) {
          this.安排一次性(db, record);
        } else {
          await db.刪除排程(record.id);
          已刪除++;
        }
      }
    }

    await info('定時服務', `已排程 ${已排程} 個任務（${已刪除} 個一次性已清理）`);
  }

  /**
   * 執行期新增一筆排程（供後台/API 呼叫）
   * 需先寫入資料庫後再呼叫此方法，才會即時生效
   */
  新增排程(record: 排程記錄, db: 排程資料庫): void {
    const key = this.任務Key(record);
    if (this.計時器.has(key)) clearTimeout(this.計時器.get(key));

    if (record.循環) {
      this.安排循環(db, record);
    } else if (record.最後執行.getTime() === 0) {
      this.安排一次性(db, record);
    }
  }

  /** 安排循環任務 */
  private 安排循環(db: 排程資料庫, record: 排程記錄): void {
    const key = this.任務Key(record);
    if (this.計時器.has(key)) clearTimeout(this.計時器.get(key));

    const lastRun = record.最後執行.getTime();
    const nextRun = lastRun > 0
      ? Math.max(lastRun + record.間隔毫秒, Date.now() + 1000)
      : Date.now() + 1000;

    const delay = nextRun - Date.now();

    this.計時器.set(key, setTimeout(async () => {
      try {
        await info('定時服務', `執行: "${record.名稱}" → ${record.命令}`);
        await db.更新最後執行(record.id, new Date());
        await this.執行命令(record);
        await info('定時服務', `完成: "${record.名稱}"`);
      } catch (err) {
        await error('定時服務', `"${record.名稱}" 失敗: ${err}`);
      }
      // 重新排程下一次
      record.最後執行 = new Date();
      this.安排循環(db, record);
    }, delay));
  }

  /** 安排一次性任務（只跑一次，跑完刪除） */
  private 安排一次性(db: 排程資料庫, record: 排程記錄): void {
    const key = this.任務Key(record);

    this.計時器.set(key, setTimeout(async () => {
      try {
        await info('定時服務', `一次性: "${record.名稱}" → ${record.命令}`);
        await db.更新最後執行(record.id, new Date());
        await this.執行命令(record);
        await info('定時服務', `一次性完成: "${record.名稱}"，自我銷毀`);

        await db.刪除排程(record.id);
        this.計時器.delete(key);
      } catch (err) {
        await error('定時服務', `一次性 "${record.名稱}" 失敗: ${err}`);
      }
    }, 1000));
  }

  /** 從 record.host 建構 baseUrl 並 fetch */
  private async 執行命令(record: 排程記錄): Promise<void> {
    const baseUrl = record.host
      ? `http://${record.host}`
      : 'http://localhost:8000';
    const url = `${baseUrl}${record.命令}`;
    const resp = await fetch(url, { method: 'POST' });
    if (!resp.ok) {
      throw new Error(`API ${url} 回傳 ${resp.status}`);
    }
  }

  private 任務Key(record: 排程記錄): string {
    return `${record.名稱}:${record.host ?? ''}`;
  }

  /** 停止所有排程 */
  停止(): void {
    for (const timer of this.計時器.values()) {
      clearTimeout(timer);
    }
    this.計時器.clear();
  }
}

// 全域單例
export const 定時器 = new 定時服務();
