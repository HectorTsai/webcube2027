/**
 * GET /l3/:collection — Model types 列表 / getById 查詢
 *
 * 直接導出 crud.ts 的 handleCollection，消除重複邏輯。
 * 完整功能（scope=all 合併、L3 異常降級）已在 crud.ts 中統一實作。
 */

import { handleCollection } from '../../../../utils/crud.ts';

export const GET = handleCollection;