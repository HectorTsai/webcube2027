/**
 * Setup 頁面中介層 — 標記為安裝模式
 *
 * 讓 setup 頁面的 handler 知道目前正在安裝流程中。
 */

import type { Context, Next } from 'hono';

export async function middleware(c: Context, next: Next) {
  c.set('安裝模式', true);
  return await next();
}