/**
 * GET /:id — 通用單筆查詢
 *
 * Middleware 已處理 JWT 與 effective_host。
 * 直接導出 crud.ts 的 handleGetById 工廠函數，與 PUT/PATCH/DELETE 保持一致。
 */

import { handleGetById } from '../../../utils/crud.ts';

export const GET = handleGetById;
