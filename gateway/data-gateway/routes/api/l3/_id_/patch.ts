/**
 * PATCH /l3/:id — 通用部分更新
 *
 * Middleware 已確保已認證 JWT 與 L3 權限。
 */

import { handlePatch } from '../../../../utils/crud.ts';
export const PATCH = handlePatch;