/**
 * services/scheduler/index.ts — AI 排程器
 *
 * 定期排程任務：
 * 1. 自動重試失敗的請求
 * 2. 清理過期的排程記錄
 * 3. 用量統計彙總（TODO）
 *
 * 資料讀寫透過 dataGwClient 與 data-gateway 互動。
 */

import { error, info } from '@dui/util';
import { list, create } from '../dataGwClient.ts';

// ── 型別 ──

interface 排程記錄 {
  id: string;
  類型: string;
  狀態: 'pending' | 'running' | 'completed' | 'failed';
  目標: string;
  承載: Record<string, unknown>;
  排程時間: string;
  開始時間?: string;
  完成時間?: string;
  錯誤訊息?: string;
  重試次數: number;
}

// ── 排程器 ──

let timerId: number | null = null;
const 間隔 = 60_000; // 每分鐘檢查一次

export async function startScheduler(): Promise<void> {
  if (timerId !== null) return;

  await info('Scheduler', '排程器已啟動（間隔：60 秒）');
  await processPendingJobs(); // 啟動時立即執行一次

  timerId = setInterval(async () => {
    try {
      await processPendingJobs();
    } catch (err) {
      await error('Scheduler', `排程處理錯誤：${err}`);
    }
  }, 間隔);
}

export function stopScheduler(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

// ── 排程處理 ──

async function processPendingJobs(): Promise<void> {
  try {
    const jobs = await list<Record<string, unknown>>('排程記錄', 'pending', { limit: 50 });

    for (const raw of jobs) {
      const job = raw as unknown as 排程記錄;
      await info('Scheduler', `處理排程：${job.id} (${job.類型})`);

      switch (job.類型) {
        case 'ai_retry':
          await handleRetry(job);
          break;
        case 'usage_report':
          await handleUsageReport(job);
          break;
        default:
          await error('Scheduler', `未知排程類型：${job.類型}`);
      }
    }
  } catch (err) {
    await error('Scheduler', `讀取排程記錄失敗：${err}`);
  }
}

async function handleRetry(job: 排程記錄): Promise<void> {
  // 將 job 標記為 running
  await updateJobStatus(job.id, 'running');

  try {
    // TODO: 實際重試邏輯 — 重新呼叫 AI 服務
    await info('Scheduler', `重試任務：${job.id}`);
    await updateJobStatus(job.id, 'completed');
  } catch (err) {
    await updateJobStatus(job.id, 'failed', String(err));
  }
}

async function handleUsageReport(_job: 排程記錄): Promise<void> {
  // TODO: 彙總各 AI 伺服器用量，寫入 data-gateway
  await info('Scheduler', '用量報表產生（尚未實作）');
}

async function updateJobStatus(
  id: string,
  狀態: 排程記錄['狀態'],
  錯誤訊息?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { 狀態 };

  if (狀態 === 'running') update.開始時間 = now;
  if (狀態 === 'completed' || 狀態 === 'failed') update.完成時間 = now;
  if (錯誤訊息) update.錯誤訊息 = 錯誤訊息;

  // 透過 dataGwClient 更新 — 使用 PUT /api/{id}
  const { update: dataGwUpdate } = await import('../dataGwClient.ts');
  await dataGwUpdate(id, update);
}