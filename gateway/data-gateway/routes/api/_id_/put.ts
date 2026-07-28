/**
 * PUT /:id — 通用整筆更新
 *
 * Middleware 已確保非訪客。
 */

import { handleUpdate } from '../../../utils/crud.ts';
export const PUT = handleUpdate;
