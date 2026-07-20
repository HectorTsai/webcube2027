// /utils/安全過濾器.ts — L1 安全過濾 & 完整性雜湊
// 提供寫入前過濾 + 渲染前 hash 驗證

import { warn } from "./logger.ts";

// ── 正則模式 ──

// 1. 移除 <script> 標籤及其內容
const SCRIPT_TAG_RE = /<script[\s\S]*?>[\s\S]*?<\/script\s*>/gi;

// 2. 移除危險 URI 協定 (javascript:, data:, vbscript:, file:)
const DANGEROUS_URI_RE = /\b(javascript|data|vbscript|file):/gi;

// 3. 移除 Inline 事件處理器屬性（支援跨行、反引號、空值）
const INLINE_EVENT_RE = /on\w+\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s>]*)/gi;

// 4. 危險 HTML 標籤
const DANGEROUS_TAGS = ['script', 'iframe', 'embed', 'object', 'applet', 'frame'];

// 🏎️ 危險標籤正則預編譯（模組載入時一次性建立，避免每次 filter 調用重複 new RegExp × 12）
const 危險標籤正則對: [RegExp, RegExp][] = DANGEROUS_TAGS.map(tag => [
  new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'),  // 配對標籤
  new RegExp(`<${tag}[^>]*\\/>`, 'gi'),                          // 自閉合標籤
]);

// ── L1 安全過濾函數 ──

// ReDoS 防護：輸入長度上限（防止正則回溯爆炸）
const MAX_FILTER_LENGTH = 50000;

function 長度防線(html: string, fnName: string): string | undefined {
  if (html.length > MAX_FILTER_LENGTH) {
    warn("安全過濾器", `${fnName}: 輸入長度 ${html.length} 超過上限 ${MAX_FILTER_LENGTH}，安全降級為空字串`);
    return undefined;
  }
  return html; // 通過檢查，回傳原值供鏈式處理
}

/** 移除字串中的 <script> 標籤及其內容 */
export function 移除Script(html: string): string {
  const safe = 長度防線(html, "移除Script");
  return safe ? safe.replace(SCRIPT_TAG_RE, '') : '';
}

/** 移除字串中的危險 URI 協定 */
export function 移除危險URI(html: string): string {
  const safe = 長度防線(html, "移除危險URI");
  return safe ? safe.replace(DANGEROUS_URI_RE, 'about:blank') : '';
}

/** 移除字串中的 Inline 事件處理器 */
export function 移除Inline事件(html: string): string {
  const safe = 長度防線(html, "移除Inline事件");
  return safe ? safe.replace(INLINE_EVENT_RE, '') : '';
}

/** 檢查字串是否含有危險 HTML 標籤 */
export function 含有危險標籤(html: string): boolean {
  const lower = html.toLowerCase();
  return DANGEROUS_TAGS.some((tag) => lower.includes(`<${tag}`));
}

/** 移除危險 HTML 標籤及其內容（script/iframe/embed/object/applet/frame） */
export function 移除危險標籤(html: string): string {
  const safe = 長度防線(html, "移除危險標籤");
  if (!safe) return '';
  let result = safe;
  for (const [paired, selfClose] of 危險標籤正則對) {
    result = result.replace(paired, '');
    result = result.replace(selfClose, '');
  }
  return result;
}

// ── L1 安全過濾（組合入口）──

/**
 * L1 安全過濾四合一
 * 按順序：移除危險標籤 → 移除 script → 移除危險 URI → 移除 inline 事件
 * 各子函數內部已有獨立長度防線，此處再做第一層 fail-fast
 */
export function 安全過濾(html: string): string {
  const safe = 長度防線(html, "安全過濾");
  if (!safe) return '';
  let result = safe;
  result = 移除危險標籤(result);
  result = 移除Script(result);
  result = 移除危險URI(result);
  result = 移除Inline事件(result);
  return result;
}

// ── CSS 安全過濾（深度防禦）──

// 5. CSS 注入攻擊模式：</style> 標籤閉合
const CSS_STYLE_CLOSE_RE = /<\/style/gi;

// 6. CSS 危險 URI（在 url() 中）
const CSS_URL_DANGEROUS_RE = /url\s*\(\s*['"]?\s*(javascript|data|vbscript):/gi;

// 7. CSS expression() 攻擊（IE 舊版漏洞）
const CSS_EXPRESSION_RE = /expression\s*\(/gi;

// 8. CSS -moz-binding（Firefox XUL 攻擊）
const CSS_MOZ_BINDING_RE = /-moz-binding\s*:/gi;

// 9. CSS behavior（IE HTC 攻擊）
const CSS_BEHAVIOR_RE = /behavior\s*:/gi;

/**
 * CSS 內容安全過濾
 * 用於 <style> 標籤內的 CSS 內容，防止 CSS 注入攻擊
 */
export function 安全過濾CSS(css: string): string {
  const safe = 長度防線(css, "安全過濾CSS");
  if (!safe) return '';
  let result = css;
  // 移除 </style> 標籤閉合攻擊
  result = result.replace(CSS_STYLE_CLOSE_RE, '');
  // 移除危險 URI（javascript:, data:, vbscript:）
  result = result.replace(CSS_URL_DANGEROUS_RE, 'url(about:blank)');
  // 移除 expression() 攻擊
  result = result.replace(CSS_EXPRESSION_RE, '');
  // 移除 -moz-binding 攻擊
  result = result.replace(CSS_MOZ_BINDING_RE, '');
  // 移除 behavior 攻擊
  result = result.replace(CSS_BEHAVIOR_RE, '');
  return result;
}

// ── 模板插值正則（全管線共用）──

/** 純模板鍵：整段字串為單一 {key}，如 "{userName}"（不含前後綴文字） */
export const 純模板正則 = /^\{[\w\-.]+\}$/;

/** 含模板：字串中任意位置出現 {，用於快速判斷是否需要插值 */
export const 含模板正則 = /\{/;

// ── 字串變數替換（{variable} 插值）──

/** 全管線共用的智慧插值：僅在字串含 { 時才進行替換，否則原值回傳 */
export function 智慧插值(val: any, args: Record<string, unknown>): any {
  if (typeof val !== "string" || !val.includes("{")) return val;

  // 純模板：完整字串為單一 {key} 佔位符（無前後綴文字）
  // 此時應回傳原始值（保留陣列/物件型別），避免 substitute 的 String() 破壞型別
  const pureKeyMatch = val.match(/^\{([\w\-\.\u4e00-\u9fa5]+)\}$/);
  if (pureKeyMatch) {
    const keys = pureKeyMatch[1].split(".");
    let result: unknown = args;
    for (const k of keys) {
      if (result && typeof result === "object" && k in (result as Record<string, unknown>)) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return val; // 找不到時回傳原模板字串
      }
    }
    return result !== undefined ? result : val;
  }

  // 混合模板（如 "{prefix} © {copyright.開始年份}-{currentYear}"）→ 走字串拼接
  return substitute(val, args);
}

/** 將字串中的 {key} 佔位符替換為 args 中對應的值 */
export function substitute(value: unknown, args: Record<string, unknown>): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\{([\w\-\.\u4e00-\u9fa5]+)\}/g, (_, key: string) => {
    const keys = key.split('.');
    let val: unknown = args;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in (val as Record<string, unknown>)) {
        val = (val as Record<string, unknown>)[k];
      } else {
        val = undefined;
        break;
      }
    }
    return val !== undefined && val !== null ? String(val) : `{${key}}`;
  });
}

// ── CSS 上下文安全替換（substitute + 過濾一次完成）──

/**
 * CSS 上下文安全替換
 * 用於 style/className 等 CSS 屬性值的 {variable} 插值。
 * 先執行 substitute 替換，再對替換後的值進行 CSS 安全過濾，
 * 防止惡意使用者透過變數值注入 CSS 或跳出上下文。
 */
export function substituteCSS(value: unknown, args: Record<string, unknown>): string {
  return 安全過濾CSS(substitute(value, args));
}

// ── Cube JSON 遞迴安全過濾 ──

/**
 * 對 Cube JSON 物件進行遞迴安全過濾
 * 掃描所有 string 型別的值，執行 L1 安全過濾
 */
export function 安全過濾Cube(cube: unknown): unknown {
  if (typeof cube === 'string') {
    return 安全過濾(cube);
  }
  if (Array.isArray(cube)) {
    return cube.map((item) => 安全過濾Cube(item));
  }
  if (cube !== null && typeof cube === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(cube as Record<string, unknown>)) {
      // 🛡️ 原型鏈防禦：跳過 __proto__ / constructor / prototype 鍵
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      const cleanKey = key.trim();
      result[cleanKey] = 安全過濾Cube(value);
      // 🛡️ 事件注入防禦：onXxx 開頭（trim 後比對，防止空白前綴繞過）或 alpine
      if (/^on\w+$/i.test(cleanKey) || cleanKey === 'alpine') {
        delete result[cleanKey];
      }
    }
    return result;
  }
  return cube;
}

// ── 完整性雜湊 ──

/**
 * 確定性 JSON 序列化（Key 排序）
 * 確保 {a:1, b:2} 與 {b:2, a:1} 產出相同的雜湊值，
 * 避免 JSON.stringify 的 Key 寫入順序不確定性導致驗證失敗。
 */
function 確定性序列化(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(確定性序列化).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const parts = sortedKeys.map(k =>
    `${JSON.stringify(k)}:${確定性序列化((obj as Record<string, unknown>)[k])}`
  );
  return '{' + parts.join(',') + '}';
}

/** 從環境變數取得 SECRET_KEY，生產環境缺失時強制拋錯阻斷 */
function 取得密鑰(): string {
  const key = Deno.env.get('SECRET_KEY');
  if (key) return key;
  // 🛡️ 非開發環境強制阻斷，防止靜默降級至預設密鑰導致完整性校驗形同虛設
  const env = Deno.env.get('DENO_ENV');
  if (env && env !== 'development') {
    throw new Error('生產環境缺少 SECRET_KEY 環境變數，拒絕啟動以確保完整性校驗安全');
  }
  return 'webcube-default-secret-key-do-not-use-in-production';
}

/**
 * 計算 Cube JSON 的完整性雜湊
 * 在 AI 審查通過後呼叫，將結果存入方塊.已檢驗
 */
export async function 計算完整性雜湊(cubeData: Record<string, unknown>): Promise<string> {
  const 密鑰 = 取得密鑰();
  const 內容 = 確定性序列化(cubeData) + 密鑰;
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(內容));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 驗證 Cube JSON 的完整性
 * 若 hash 匹配表示內容未被篡改，回傳 true
 */
export async function 驗證完整性(cubeData: Record<string, unknown>, 預期雜湊: string): Promise<boolean> {
  const 實際雜湊 = await 計算完整性雜湊(cubeData);
  return 實際雜湊 === 預期雜湊;
}
