/**
 * Alpine.js 支援模組 — dui-framework 自帶 Alpine runtime（vendor 檔）
 *
 * 提供：
 *  - mountAlpineAssets(app)  → 註冊 GET /alpine.min.js 靜態路由（createGateway 以 alpine: true 自動呼叫）
 *  - alpineScripts(app)      → 回傳 <script> 標籤 HTML 字串（含可選的頁面元件註冊檔，順序：app → runtime）
 *
 * 使用方式（gateway 的 _layout.tsx）：
 *   import { alpineScripts } from '@dui/framework';
 *   import { raw } from 'hono/html';
 *   // 若要註冊頁面級 Alpine 元件，先把元件碼放 routes/static/app.js（會被 route-loader 靜態服務）
 *   {raw(alpineScripts('/static/app.js'))}
 *
 * 載入順序必須是：元件註冊檔（defer、在前）→ Alpine runtime（defer、在後），
 * 因為元件檔需以 document.addEventListener('alpine:init', …) 在 Alpine 啟動前註冊。
 */

import type { Hono } from 'hono';

/** Alpine runtime 的對外路徑 */
export const ALPINE_JS_PATH = '/alpine.min.js';

/** Alpine 版號（與 vendor 檔對應） */
export const ALPINE_VERSION = '3.14.9';

let cachedDist: ArrayBuffer | null = null;

/** 讀取 vendor 的 Alpine dist（啟動時讀一次並快取） */
export async function getAlpineDist(): Promise<Uint8Array<ArrayBuffer>> {
  if (!cachedDist) {
    cachedDist = (await Deno.readFile(new URL('./vendor/alpine.min.js', import.meta.url))).buffer as ArrayBuffer;
  }
  return new Uint8Array(cachedDist);
}

/** 註冊 Alpine runtime 靜態路由（GET /alpine.min.js） */
export async function mountAlpineAssets(app: Hono): Promise<void> {
  const body = await getAlpineDist();
  app.get(ALPINE_JS_PATH, (c) =>
    c.body(body, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400',
    })
  );
}

/**
 * 輸出 Alpine <script> 標籤 HTML 字串。
 * @param app 頁面級 Alpine 元件註冊檔（必須在 runtime 之前載入）；預設無
 */
export function alpineScripts(app?: string): string {
  const appTag = app ? `<script defer src="${app}"></script>` : '';
  return `${appTag}<script defer src="${ALPINE_JS_PATH}"></script>`;
}
