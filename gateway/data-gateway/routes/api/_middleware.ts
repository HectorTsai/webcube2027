/**
 * 通用 API Middleware
 *
 * 只解析 JWT 並設定 `jwt_payload` 與 `effective_host`。
 * 不強制任何權限檢查 — 各子路徑 Middleware 各自負責：
 *   - /api/l3/*  → api/l3/_middleware.ts（L3 權限）
 *   - /api/l2/*  → api/l2/_middleware.ts（L2 權限）
 *   - /api/setup/* → api/setup/_middleware.ts（安裝守衛）
 *   - /api/site/*  → api/site/_middleware.ts（已認證）
 */

import type { Context, Next } from 'hono';
import { extractToken, verifyToken } from '@dui/util/jwt';

export const middleware = async (c: Context, next: Next) => {
  const token = extractToken(c);
  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload) {
        c.set('jwt_payload', payload);
        if (payload.tenant) {
          c.set('effective_host', payload.tenant);
        }
      }
    } catch {
      // token 無效 → 視為未攜帶 JWT
    }
  }
  await next();
};