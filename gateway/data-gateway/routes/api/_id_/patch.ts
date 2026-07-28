/**
 * PATCH /:id — 通用部分更新
 *
 * Middleware 已確保非訪客。
 */

import { handlePatch } from '../../../utils/crud.ts';
export const PATCH = handlePatch;
