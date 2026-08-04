/**
 * GET /:lang/ — 首頁（有語言前綴）
 */

import type { Context } from 'hono';

export default function Index({ lang }: { lang?: string }) {
  const prefix = `/${lang || 'zh-tw'}`;
  return (
    <div class="hero min-h-[60vh]">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-4xl font-bold">Site Gateway</h1>
          <p class="py-4 text-base-content/60">
            網站管理閘道 — 負責網站註冊、刪除與設定管理
          </p>
          <a href={`${prefix}/setup`} class="btn btn-primary">開始安裝</a>
        </div>
      </div>
    </div>
  );
}