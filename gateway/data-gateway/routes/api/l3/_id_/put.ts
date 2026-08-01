/**
 * PUT /l3/:id — 通用整筆更新
 *
 * Middleware 已確保已認證 JWT 與 L3 權限。
 */

import { handleUpdate } from '../../../../utils/crud.ts';
export const PUT = handleUpdate;