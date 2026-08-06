/**
 * Pool 狀態顯示共用 helper — 所有 gateway 的 pool 項目一覽統一使用
 *
 * 各 gateway 的 pool（BasePool 子類，如 AdapterPool / SitePool / AccountPool）
 * 的 overview 皆含 `isPersistent` / `maxIdleMs` 欄位（由 dui-pool 統一輸出），
 * 前端一律透過 `window.PoolStatus.itemMeta()` 格式化顯示，
 * 避免每個 gateway 重複維護「剩餘倒數 / ∞」格式。
 *
 * 使用方式：
 *   - `createGateway` 自動掛載 `GET /pool-status.js`
 *   - GatewayLayout 於 <body> 開頭同步載入（先於頁面 inline script 執行）
 *   - 頁面 script 直接呼叫 `PoolStatus.itemMeta(it)` / `PoolStatus.remainFmt(ms)`
 */

import type { Hono } from 'hono';

/** 共用 pool 狀態 helper 的對外路徑 */
export const POOL_STATUS_JS_PATH = '/pool-status.js';

/** 瀏覽器端 helper 原始碼（輸出為 window.PoolStatus） */
export const POOL_STATUS_JS = `/**
 * PoolStatus — dui-framework 共用 Pool 項目顯示 helper
 * 由 dui-framework 統一提供，所有 gateway 的 pool 一覽共用。
 * 需在呼叫 itemMeta() 的 script 之前載入。
 */
window.PoolStatus = {
  // 剩餘時間倒數格式：剩餘 X 分鐘 / X 小時 X 分 / X 秒；0 → 待清理
  remainFmt(ms) {
    if (ms <= 0) return '待清理';
    const totalMin = Math.ceil(ms / 60000);
    if (totalMin >= 60) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return m > 0 ? h + ' 小時 ' + m + ' 分' : h + ' 小時';
    }
    if (totalMin >= 1) return totalMin + ' 分鐘';
    return Math.max(1, Math.round(ms / 1000)) + ' 秒';
  },
  // 剩餘毫秒由 pool 直接算好（it.remainMs，快照時點）；
  // null = 常駐或未設定踢除閾值 → 永不因閒置被踢除，顯示 ∞
  itemMeta(it) {
    if (it.remainMs == null) {
      return it.accessCount + ' 次存取 · 剩餘 ∞';
    }
    return it.accessCount + ' 次存取 · 剩餘 ' + this.remainFmt(it.remainMs);
  },
};
`;

/** 註冊 GET /pool-status.js（所有 gateway 由 createGateway 統一掛載） */
export async function mountPoolStatusAssets(app: Hono): Promise<void> {
  app.get(POOL_STATUS_JS_PATH, (c) =>
    c.body(POOL_STATUS_JS, 200, {
      'Content-Type': 'application/javascript',
      // 開發期間避免瀏覽器快取舊版
      'Cache-Control': 'no-cache',
    })
  );
}
