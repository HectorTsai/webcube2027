// 定時服務 — Deno.cron 心跳模式，定時掃描資料庫排程記錄並執行到期任務
//
// 架構：
//   啟動時：資料池初始化完成 → 定時器.排程(排程資料庫) → 計算 GCD → 註冊 Deno.cron
//   執行期：心跳觸發 → 掃描所有啟用排程 → 到期者執行
//     循環任務：最後執行 + 間隔分鐘 >= now → 執行，更新最後執行
//     一次性任務：建立時間 + 間隔分鐘 >= now 且尚未執行（最後執行 = epoch） → 執行，刪除
//   動態調整：每次心跳後重算 GCD，若有變更則同名覆蓋 Deno.cron
//
// 如何新增排程：
//   寫入資料庫一筆排程記錄即可，下一次心跳自然會偵測並執行

import 排程記錄 from '../../database/models/排程記錄.ts';
import { info, error } from '../../utils/logger.ts';

/** 排程器需要的資料庫操作介面 */
export interface 排程資料庫 {
  讀取所有排程(): Promise<排程記錄[]>;
  更新最後執行(id: string, 時間: Date): Promise<void>;
  刪除排程(id: string): Promise<void>;
}

const CRON_NAME = 'scheduler-heartbeat';

class 定時服務 {
  private 已停止 = false;
  private 執行中 = new Set<string>();
  private db: 排程資料庫 | null = null;
  private 目前GCD = 1;

  /**
   * 從給定的資料庫載入排程記錄，計算 GCD 後註冊 Deno.cron 心跳
   */
  async 排程(db: 排程資料庫): Promise<void> {
    this.db = db;
    await this.註冊心跳();
    await info('定時服務', `Deno.cron 心跳已啟動（GCD: ${this.目前GCD} 分鐘）`);
  }

  /** 計算 GCD 並註冊/更新 Deno.cron，同名自動覆蓋舊排程 */
  private async 註冊心跳(): Promise<void> {
    if (!this.db) return;
    const tasks = await this.db.讀取所有排程();
    this.目前GCD = this.計算GCD(tasks);

    const expr = this.GCD轉表達式(this.目前GCD);

    Deno.cron(CRON_NAME, expr, () => {
      if (this.已停止) return;
      this.執行到期任務();
    });
  }

  /**
   * 將 GCD 分鐘數攤成時長，依整除性自動選用最合適的 cron 欄位
   * 使用 Temporal.Duration 進行精準進位，避免「步進值 N=60」這類邊界錯誤，
   * 優先以更高時間單位（時/日）表達
   *
   * 規則：
   *   ≤ 1 分鐘            → 每分鐘
   *   不到 1 小時整分鐘   → 每 N 分鐘（minute 欄位步進）
   *   整小時               → 每 N 小時（hour 欄位步進）
   *   整天數               → 每 N 天（day-of-month 欄位步進）
   *   非整除（90/150 分鐘）→ fallback 每分鐘（由 callback 內判斷）
   */
  private GCD轉表達式(分鐘: number): string {
    if (分鐘 <= 1) return '* * * * *';

    const dur = Temporal.Duration.from({ minutes: 分鐘 });

    // 整天數：進位到「天」後，時/分皆為 0
    const asDays = dur.round({ largestUnit: 'days' });
    if (asDays.days >= 1 && asDays.hours === 0 && asDays.minutes === 0) {
      return `0 0 */${asDays.days} * *`;
    }

    // 整小時：進位到「小時」後，分為 0
    const asHours = dur.round({ largestUnit: 'hours' });
    if (asHours.hours >= 1 && asHours.minutes === 0) {
      return `0 */${asHours.hours} * * *`;
    }

    // 不到 1 小時的整分鐘
    if (asHours.hours === 0 && asHours.minutes >= 1) {
      return `*/${分鐘} * * * *`;
    }

    // 非整除（如 90、150 分鐘）→ fallback
    return '* * * * *';
  }

  /** 計算所有啟用排程 間隔分鐘 的最大公因數 */
  private 計算GCD(tasks: 排程記錄[]): number {
    const 分鐘 = tasks
      .filter(t => t.啟用)
      .map(t => t.間隔分鐘)
      .filter(m => m > 0);

    if (分鐘.length === 0) return 1;

    const gcd2 = (a: number, b: number): number =>
      b === 0 ? a : gcd2(b, a % b);
    return 分鐘.reduce(gcd2);
  }

  /** 心跳觸發：掃描所有啟用排程，執行到期任務 */
  private async 執行到期任務(): Promise<void> {
    if (!this.db) return;
    const now = Date.now();
    const tasks = await this.db.讀取所有排程();

    let 已執行 = 0;
    let 已刪除 = 0;

    for (const task of tasks) {
      if (!task.啟用 || this.執行中.has(task.id)) continue;

      const lastRun = task.最後執行.getTime();

      if (task.循環) {
        const nextRun = lastRun + task.間隔分鐘 * 60000;
        if (now >= nextRun) {
          await this.執行循環任務(task);
          已執行++;
        }
      } else {
        // 一次性任務：尚未執行（epoch）且已到排定時間
        if (lastRun === 0) {
          const runAt = task.建立時間.getTime() + task.間隔分鐘 * 60000;
          if (now >= runAt) {
            await this.執行一次性任務(task);
            已執行++;
            已刪除++;
          }
        }
      }
    }

    if (已執行 > 0) {
      await info('定時服務', `本輪執行 ${已執行} 個任務（${已刪除} 個一次性已刪除）`);
    }

    // 重算 GCD，若有變更則重新註冊（同名覆蓋）
    const newGcd = this.計算GCD(tasks);
    if (newGcd !== this.目前GCD) {
      await info('定時服務', `GCD 變更: ${this.目前GCD} → ${newGcd}，更新心跳間隔`);
      await this.註冊心跳();
    }
  }

  private async 執行循環任務(task: 排程記錄): Promise<void> {
    if (!this.db) return;
    this.執行中.add(task.id);
    try {
      await info('定時服務', `執行: "${task.名稱}" → ${task.命令}`);
      await this.db.更新最後執行(task.id, new Date());
      await this.執行命令(task);
      await info('定時服務', `完成: "${task.名稱}"`);
    } catch (err) {
      await error('定時服務', `"${task.名稱}" 失敗: ${err}`);
    } finally {
      this.執行中.delete(task.id);
    }
  }

  private async 執行一次性任務(task: 排程記錄): Promise<void> {
    if (!this.db) return;
    this.執行中.add(task.id);
    try {
      await info('定時服務', `一次性: "${task.名稱}" → ${task.命令}`);
      await this.db.更新最後執行(task.id, new Date());
      await this.執行命令(task);
      await info('定時服務', `一次性完成: "${task.名稱}"，自我銷毀`);
      await this.db.刪除排程(task.id);
    } catch (err) {
      await error('定時服務', `一次性 "${task.名稱}" 失敗: ${err}`);
    } finally {
      this.執行中.delete(task.id);
    }
  }

  /** 從 task.host 建構 baseUrl 並 fetch */
  private async 執行命令(task: 排程記錄): Promise<void> {
    const baseUrl = task.host
      ? `http://${task.host}`
      : 'http://localhost:8000';
    const url = `${baseUrl}${task.命令}`;
    const resp = await fetch(url, { method: 'POST' });
    if (!resp.ok) {
      throw new Error(`API ${url} 回傳 ${resp.status}`);
    }
  }

  /** 停止所有排程（設定旗標，心跳中斷執行） */
  停止(): void {
    this.已停止 = true;
  }
}

// 全域單例
export const 定時器 = new 定時服務();
