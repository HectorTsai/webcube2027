/**
 * DELETE /:id — 通用刪除
 *
 * Middleware 已確保非訪客。
 */

import { handleDelete } from '../../../utils/crud.ts';
export const DELETE = handleDelete;
