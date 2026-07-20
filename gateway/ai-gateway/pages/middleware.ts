// 全站 Middleware — 套用於所有頁面路由
import type { MiddlewareHandler } from "hono";

const 全局中間件: MiddlewareHandler = async (c, next) => {
  // 可在這裡加入全站共用的邏輯，例如：
  //   - 請求計時
  //   - 安全標頭
  //   - 統一的快取策略
  await next();
};

export default 全局中間件;
