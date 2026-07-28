/**
 * POST /:collection/:model — 通用新增
 *
 * Middleware 已確保非訪客（拒絕匿名 token）。
 * effective_host 由 Middleware 依 JWT tenant 設定。
 */

import { handleCreate } from '../../../../utils/crud.ts';
export const POST = handleCreate;
