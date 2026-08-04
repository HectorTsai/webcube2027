/**
 * GET /api/role* — 需已認證且對「使用者」collection 有讀權限
 *
 * 角色資料的 composite ID 為 `使用者:角色:*`（collection=使用者, model=角色），
 * 故檢查「使用者」collection 的讀權限（與 user/_middleware.ts 相同）。
 */

import { requireCollectionRead } from '../../../utils/require-auth.ts';

export const middleware = requireCollectionRead('使用者');
