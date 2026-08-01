/**
 * DELETE /l3/:id — 通用刪除
 *
 * Middleware 已確保已認證 JWT 與 L3 權限。
 */

import { handleDelete } from '../../../../utils/crud.ts';
export const DELETE = handleDelete;