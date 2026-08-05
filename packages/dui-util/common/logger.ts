/**
 * Logger — 日誌記錄工具
 *
 * 提供四種日誌層級（debug / info / warn / error），支援選擇性檔案寫入、
 * 序列化 Promise chain 防併發鎖定、以及 Trace ID 自動輸出。
 *
 * 環境變數：
 *   - LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'（預設 'info'）
 *   - LOG_TO_FILE: 'true' 啟用檔案輸出，寫入 ./logs/app.log
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export type 日誌等級 = 'debug' | 'info' | 'warn' | 'error';

/** 全域 AsyncLocalStorage，由 @dui/framework 的 Trace ID middleware 寫入 */
export const traceStorage = new AsyncLocalStorage<string>();

interface 日誌配置 {
  等級: 日誌等級;
  寫入檔案: boolean;
  檔案路徑?: string;
}

class Logger {
  private 配置: 日誌配置;
  private 等級順序: Record<日誌等級, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  /** 序列化寫入佇列，防止高頻併發寫入造成 ResourceBusy */
  private logQueue: Promise<void> = Promise.resolve();

  constructor(配置: 日誌配置) {
    this.配置 = 配置;
  }

  private 應該記錄(等級: 日誌等級): boolean {
    return this.等級順序[等級] >= this.等級順序[this.配置.等級];
  }

  /**
   * 從 AsyncLocalStorage 取得當前請求的 trace_id
   * 若無（非請求上下文），回傳 undefined
   */
  private getTraceId(): string | undefined {
    return traceStorage.getStore();
  }

  private 格式化訊息(等級: 日誌等級, 模組: string, 訊息: string, traceId?: string): string {
    const 時間戳 = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const id = traceId || this.getTraceId();
    if (id) {
      return `[${時間戳}] [${等級.toUpperCase()}] [${id}] [${模組}] ${訊息}`;
    }
    return `[${時間戳}] [${等級.toUpperCase()}] [${模組}] ${訊息}`;
  }

  private async 寫入檔案(格式化訊息: string): Promise<void> {
    if (!this.配置.寫入檔案 || !this.配置.檔案路徑) return;

    const 資料 = new TextEncoder().encode(格式化訊息 + '\n');

    // 排隊寫入：重複呼叫會依序執行，不會同時打開同一檔案
    this.logQueue = this.logQueue
      .then(() => Deno.writeFile(this.配置.檔案路徑!, 資料, { append: true, create: true }))
      .catch((err) => console.error('寫入日誌檔案失敗:', err));
    return this.logQueue;
  }

  private async 記錄(等級: 日誌等級, 模組: string, 訊息: string, traceId?: string): Promise<void> {
    if (!this.應該記錄(等級)) return;

    const 格式化訊息 = this.格式化訊息(等級, 模組, 訊息, traceId);

    switch (等級) {
      case 'debug':
        console.debug(格式化訊息);
        break;
      case 'info':
        console.info(格式化訊息);
        break;
      case 'warn':
        console.warn(格式化訊息);
        break;
      case 'error':
        console.error(格式化訊息);
        break;
    }

    await this.寫入檔案(格式化訊息);
  }

  debug(模組: string, 訊息: string, traceId?: string): Promise<void> {
    return this.記錄('debug', 模組, 訊息, traceId);
  }

  info(模組: string, 訊息: string, traceId?: string): Promise<void> {
    return this.記錄('info', 模組, 訊息, traceId);
  }

  warn(模組: string, 訊息: string, traceId?: string): Promise<void> {
    return this.記錄('warn', 模組, 訊息, traceId);
  }

  error(模組: string, 訊息: string, traceId?: string): Promise<void> {
    return this.記錄('error', 模組, 訊息, traceId);
  }
}

function 初始化Logger(): Logger {
  const 日誌等級 = (Deno.env.get('LOG_LEVEL') as 日誌等級) || 'info';
  const 寫入檔案 = Deno.env.get('LOG_TO_FILE') === 'true';
  const 檔案路徑 = 寫入檔案 ? './logs/app.log' : undefined;

  return new Logger({
    等級: 日誌等級,
    寫入檔案,
    檔案路徑,
  });
}

export const logger = 初始化Logger();

export const debug = (模組: string, 訊息: string, traceId?: string) => logger.debug(模組, 訊息, traceId);
export const info = (模組: string, 訊息: string, traceId?: string) => logger.info(模組, 訊息, traceId);
export const warn = (模組: string, 訊息: string, traceId?: string) => logger.warn(模組, 訊息, traceId);
export const error = (模組: string, 訊息: string, traceId?: string) => logger.error(模組, 訊息, traceId);