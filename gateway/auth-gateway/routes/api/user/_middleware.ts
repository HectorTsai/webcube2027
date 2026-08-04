/**
 * GET /api/user* — 需已認證且對「使用者」collection 有讀權限
 *
 * 角色 model 亦屬「使用者」collection（composite ID `使用者:角色:*`），
 * 因此 /api/role* 共用相同檢查（見 role/_middleware.ts）。
 */

import { requireCollectionRead } from '../../../utils/require-auth.ts';

export const middleware = requireCollectionRead('使用者');
