/**
 * POST /l3/:collection/:model — 通用新增
 *
 * Middleware 已確保已認證 JWT 與 L3 權限。
 * effective_host 由 Middleware 依 JWT tenant 設定。
 */

import { handleCreate } from '../../../../../utils/crud.ts';
export const POST = handleCreate;