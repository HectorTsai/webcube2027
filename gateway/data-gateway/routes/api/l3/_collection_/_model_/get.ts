/**
 * GET /l3/:collection/:model — 通用列表查詢
 *
 * 直接導出 crud.ts 的 handleList，消除重複邏輯。
 * 完整功能（scope=all 合併、正確分頁計算）已在 crud.ts 統一實作。
 */

import { handleList } from '../../../../../utils/crud.ts';

export const GET = handleList;