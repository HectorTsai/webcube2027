// 資料庫解析器 — 每個請求觸發 L2/L3 初始化
// 實際連線邏輯已移入 資料池

import { Context, Next } from 'hono';
import { 資料池 } from '../database/資料池.ts';
import { error } from '../utils/logger.ts';

// 擴展 Hono Context 類型
declare module 'hono' {
  interface ContextVariableMap {
    host: string;
  }
}

export async function 資料庫解析器(c: Context, next: Next) {
  try {
    const rawHost = c.req.header('host') || 'localhost';
    const host = rawHost.replace(/^https?:\/\//, '');

    c.set('host', host);

    // L2 單例初始化（第二次以後直接 return）
    await 資料池.初始化L2();

    // L3 初始化（以 host 為 key）
    await 資料池.初始化L3(host);

    await next();
  } catch (err) {
    await error('DB-Resolver', `資料庫解析器錯誤: ${err}`);
    await next();
  }
}

export function 清理資料庫連線() {
  資料池.關閉();
}
