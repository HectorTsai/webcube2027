/**
 * dui-framework 動態 UnoCSS 引擎
 *
 * 取代 Tailwind + daisyUI 的 build step：伺服端在渲染頁面時掃描 HTML 中的
 * class，即時以 preset-wind4（Tailwind v4 相容）+ preset-typography 生成 CSS，
 * 並搭配一組「元件 CSS」補回 daisyUI 的元件類（badge/btn/card/navbar/…）。
 *
 * 設計目標：
 *   - gateway 頁面不需要改寫：保留 daisyUI 元件 class 與語意色 token
 *   - 無 build step：所有 CSS 於 render 時動態生成並內聯注入 <style>
 *   - 可快取：以 HTML 內容的 SHA-256 雜湊為 key，避免每次請求重複生成
 */

import { createGenerator } from '@unocss/core';
import { presetWind4 } from '@unocss/preset-wind4';
import { presetTypography } from '@unocss/preset-typography';

// ── 語意色 theme ──
//
// 對應 daisyUI 的語意 token：primary/secondary/accent/neutral、base-100/200/300、
// base-content、info/success/warning/error。值指向 :root 定義的 CSS 變數，
// 因此 `text-primary`、`bg-base-100/80`、`border-base-200` 都能原生解析，
// 透明度修飾符（/50 等）由 preset-wind4 以 color-mix() 處理。
export const UNOCSS_THEME_COLORS = {
  primary: 'var(--p)',
  secondary: 'var(--s)',
  accent: 'var(--a)',
  neutral: 'var(--n)',
  info: 'var(--in)',
  success: 'var(--su)',
  warning: 'var(--wa)',
  error: 'var(--er)',
  'base-100': 'var(--b1)',
  'base-200': 'var(--b2)',
  'base-300': 'var(--b3)',
  'base-content': 'var(--bc)',
} as const;

// ── 元件 CSS（daisyUI 替代層）──
//
// 這些是「複合元件樣式」，不適合用 utility class 表達（偽狀態、多 class 組合），
// 故以靜態 CSS 提供。UnoCSS 生成的 utility 會在元件 CSS 之後注入，
// 同權重下後者優先，因此頁面上的 bg-*/text-* 等工具類能覆蓋元件預設。
export const COMPONENT_CSS = `
/* ── 語意色 token（daisyUI light 主題的 oklch 值）── */
:root,
[data-theme="light"] {
  --p: oklch(63.8% 0.237 25.331);
  --s: oklch(70% 0.14 182.503);
  --a: oklch(70.9% 0.187 265.756);
  --n: oklch(20.5% 0.058 264.022);
  --b1: oklch(100% 0 0);
  --b2: oklch(97.1% 0 0);
  --b3: oklch(92.4% 0.003 48.717);
  --bc: oklch(20.5% 0.058 264.022);
  --in: oklch(68.5% 0.148 237.251);
  --su: oklch(76.4% 0.177 163.223);
  --wa: oklch(81.5% 0.148 84.429);
  --er: oklch(70.8% 0.161 22.216);
}

/* ── badge ── */
.badge {
  display: inline-flex; align-items: center; justify-content: center; gap: .25rem;
  height: 1.25rem; padding-inline: .625rem;
  border: 1px solid transparent; border-radius: 9999px;
  font-size: .75rem; font-weight: 500; line-height: 1; white-space: nowrap;
  width: fit-content; flex-shrink: 0;
  color: var(--bc);
  background-color: color-mix(in oklab, var(--bc) 8%, transparent);
}
.badge-xs { height: 1rem; padding-inline: .5rem; font-size: .625rem; }
.badge-soft { background-color: color-mix(in oklab, currentColor 14%, transparent); }
.badge-ghost { background-color: transparent; border-color: color-mix(in oklab, currentColor 20%, transparent); }
.badge-primary { color: var(--p); }
.badge-success { color: var(--su); }
.badge-error { color: var(--er); }
.badge-warning { color: var(--wa); }
.badge-info { color: var(--in); }

/* ── btn ── */
.btn {
  --btn-color: var(--bc);
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  height: 2.5rem; padding-inline: 1rem;
  border: 1px solid transparent; border-radius: .5rem;
  background-color: color-mix(in oklab, var(--bc) 8%, var(--b1));
  color: var(--btn-color);
  font-size: .875rem; font-weight: 600; line-height: 1;
  white-space: nowrap; cursor: pointer; user-select: none;
  text-decoration-line: none;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease, opacity .15s ease;
}
.btn:hover { background-color: color-mix(in oklab, var(--bc) 14%, var(--b1)); }
.btn:active { transform: scale(.97); }
.btn-xs { height: 1.5rem; padding-inline: .5rem; font-size: .6875rem; border-radius: .375rem; }
.btn-sm { height: 2rem; padding-inline: .75rem; font-size: .75rem; border-radius: .375rem; }
.btn-circle { height: 2rem; width: 2rem; padding: 0; border-radius: 9999px; }
.btn-soft { background-color: color-mix(in oklab, var(--btn-color) 12%, transparent); }
.btn-soft:hover { background-color: color-mix(in oklab, var(--btn-color) 20%, transparent); }
.btn-outline { background-color: transparent; border-color: color-mix(in oklab, var(--btn-color) 55%, transparent); }
.btn-outline:hover { background-color: var(--btn-color); color: var(--b1); border-color: var(--btn-color); }
.btn-ghost { background-color: transparent; }
.btn-ghost:hover { background-color: color-mix(in oklab, var(--btn-color) 10%, transparent); }
.btn-primary { --btn-color: var(--p); background-color: var(--p); color: oklch(100% 0 0); border-color: transparent; }
.btn-primary:hover { background-color: color-mix(in oklab, var(--p) 85%, black); }

/* ── card ── */
.card {
  position: relative; display: flex; flex-direction: column;
  border-radius: 1rem; background-color: var(--b1); overflow: hidden;
}
.card-body { display: flex; flex-direction: column; gap: .5rem; padding: 1.5rem; flex: 1 1 auto; }
.card-title { font-size: 1.25rem; font-weight: 700; line-height: 1.2; }

/* ── navbar ── */
.navbar { display: flex; align-items: center; width: 100%; min-height: 4rem; }

/* ── loading ── */
.loading {
  display: inline-block; width: var(--size, 1rem); height: var(--size, 1rem);
  vertical-align: middle; animation: loading-spin 1s linear infinite;
}
.loading-spinner {
  border: 2px solid color-mix(in oklab, currentColor 25%, transparent);
  border-top-color: currentColor; border-radius: 9999px;
}
.loading-xs { --size: .75rem; }
.loading-md { --size: 1.5rem; }
@keyframes loading-spin { to { transform: rotate(360deg); } }

/* ── modal（原生 <dialog>）── */
.modal {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem; margin: 0; width: 100%; height: 100%;
  border: 0; background-color: transparent; color: var(--bc);
}
/* 原生 <dialog> 關閉時靠 UA 樣式隱藏，但作者樣式的 display:flex 會蓋掉它，
   需明確在未開啟時隱藏，否則 modal 會一直顯示在頁面上 */
.modal:not([open]) { display: none; }
.modal::backdrop { background-color: rgb(0 0 0 / 0.4); }
.modal-box {
  position: relative; width: 100%; max-width: 32rem; border-radius: 1rem;
  background-color: var(--b1); padding: 1.5rem;
  box-shadow: 0 10px 40px rgb(0 0 0 / 0.2);
}
.modal-backdrop { position: fixed; inset: 0; z-index: -1; background-color: rgb(0 0 0 / 0.4); }

/* ── form ── */
.form-control { display: flex; flex-direction: column; }
.label-text { font-size: .875rem; font-weight: 500; line-height: 1.5; }
.label-text-alt { font-size: .75rem; line-height: 1.5; color: color-mix(in oklab, currentColor 55%, transparent); }
.input {
  height: 2.5rem; padding-inline: .875rem; border-radius: .5rem;
  border: 1px solid transparent;
  background-color: color-mix(in oklab, var(--b2) 60%, var(--b1));
  color: var(--bc); font-size: .875rem; outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.input:focus {
  border-color: var(--p);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--p) 20%, transparent);
}
.input-bordered { border-color: color-mix(in oklab, var(--bc) 20%, transparent); }
.select {
  height: 2.5rem; padding-inline: .875rem; border-radius: .5rem;
  border: 1px solid transparent;
  background-color: color-mix(in oklab, var(--b2) 60%, var(--b1));
  color: var(--bc); font-size: .875rem; outline: none;
}
.select-bordered { border-color: color-mix(in oklab, var(--bc) 20%, transparent); }

/* ── divider ── */
.divider { display: flex; align-items: center; gap: 1rem; color: color-mix(in oklab, currentColor 40%, transparent); }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background-color: color-mix(in oklab, currentColor 15%, transparent); }

/* ── v4 動態值保險（wind4 應可原生解析，保留以防解析差異）── */
.z-1 { z-index: 1; }
`;

// ── 動態生成器 ──

type PageGenerator = NonNullable<Awaited<ReturnType<typeof createGenerator>>>;

let generator: PageGenerator | null = null;

/** 惰性建立單一 generator 實例（跨請求共用，節省 createGenerator 開銷） */
async function getGenerator(): Promise<PageGenerator> {
  if (!generator) {
    generator = await createGenerator({
      presets: [
        presetWind4({ preflights: { reset: true } }),
        presetTypography(),
      ],
      theme: { colors: UNOCSS_THEME_COLORS },
    }) as PageGenerator;
  }
  return generator;
}

const cssCache = new Map<string, string>();
const CSS_CACHE_MAX = 64;

/** SHA-256 雜湊 HTML（作為快取 key） */
async function hashHtml(html: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 從完整頁面 HTML 動態生成 CSS。
 *
 * 掃描的輸入應為「整個頁面 body 的 HTML 字串」（含 inline <script>），
 * 因為 UnoCSS 的 extractor 是 token 式的，script 內 JS 模板字串中的
 * class（如 `badge badge-success`）也會被提取生成。
 *
 * @returns 元件 CSS + UnoCSS 生成 CSS 的組合字串，可直接內聯進 <style>
 */
export async function generatePageCss(html: string): Promise<string> {
  const key = await hashHtml(html);
  const hit = cssCache.get(key);
  if (hit) return hit;

  const gen = await getGenerator();
  const { css } = await gen.generate(html);
  const full = `${COMPONENT_CSS}\n${css}`;

  if (cssCache.size >= CSS_CACHE_MAX) cssCache.clear();
  cssCache.set(key, full);
  return full;
}
