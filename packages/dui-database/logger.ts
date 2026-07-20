export type 日誌等級 = 'debug' | 'info' | 'warn' | 'error';

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
    error: 3
  };

  constructor(配置: 日誌配置) {
    this.配置 = 配置;
  }

  private 應該記錄(等級: 日誌等級): boolean {
    return this.等級順序[等級] >= this.等級順序[this.配置.等級];
  }

  private 格式化訊息(等級: 日誌等級, 模組: string, 訊息: string): string {
    const 時間戳 = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return `[${時間戳}] [${等級.toUpperCase()}] [${模組}] ${訊息}`;
  }

  private async 寫入檔案(格式化訊息: string): Promise<void> {
    if (!this.配置.寫入檔案 || !this.配置.檔案路徑) return;
    
    try {
      const 編碼器 = new TextEncoder();
      const 資料 = 編碼器.encode(格式化訊息 + '\n');
      
      await Deno.writeFile(this.配置.檔案路徑, 資料, { append: true, create: true });
    } catch (錯誤) {
      console.error('寫入日誌檔案失敗:', 錯誤);
    }
  }

  private async 記錄(等級: 日誌等級, 模組: string, 訊息: string): Promise<void> {
    if (!this.應該記錄(等級)) return;

    const 格式化訊息 = this.格式化訊息(等級, 模組, 訊息);
    
    // 輸出到 console
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

    // 寫入檔案
    await this.寫入檔案(格式化訊息);
  }

  debug(模組: string, 訊息: string): Promise<void> {
    return this.記錄('debug', 模組, 訊息);
  }

  info(模組: string, 訊息: string): Promise<void> {
    return this.記錄('info', 模組, 訊息);
  }

  warn(模組: string, 訊息: string): Promise<void> {
    return this.記錄('warn', 模組, 訊息);
  }

  error(模組: string, 訊息: string): Promise<void> {
    return this.記錄('error', 模組, 訊息);
  }
}

// 從環境變數初始化 Logger
function 初始化Logger(): Logger {
  const 日誌等級 = (Deno.env.get('LOG_LEVEL') as 日誌等級) || 'info';
  const 寫入檔案 = Deno.env.get('LOG_TO_FILE') === 'true';
  const 檔案路徑 = 寫入檔案 ? './logs/app.log' : undefined;

  return new Logger({
    等級: 日誌等級,
    寫入檔案,
    檔案路徑
  });
}

// 全域 Logger 實例
export const logger = 初始化Logger();

// 便利函數
export const debug = (模組: string, 訊息: string) => logger.debug(模組, 訊息);
export const info = (模組: string, 訊息: string) => logger.info(模組, 訊息);
export const warn = (模組: string, 訊息: string) => logger.warn(模組, 訊息);
export const error = (模組: string, 訊息: string) => logger.error(模組, 訊息);
