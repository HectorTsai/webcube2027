// /utils/安全過濾器.ts — L1 安全過濾 & 完整性雜湊
// 提供寫入前過濾 + 渲染前 hash 驗證

// ── 正則模式 ──

// 1. 移除 <script> 標籤及其內容
const SCRIPT_TAG_RE = /<script[\s\S]*?>[\s\S]*?<\/script\s*>/gi;

// 2. 移除危險 URI 協定 (javascript:, data:, vbscript:, file:)
const DANGEROUS_URI_RE = /\b(javascript|data|vbscript|file):/gi;

// 3. 移除 Inline 事件處理器屬性
const INLINE_EVENT_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

// 4. 危險 HTML 標籤
const DANGEROUS_TAGS = ['script', 'iframe', 'embed', 'object', 'applet', 'frame'];

// ── L1 安全過濾函數 ──

/** 移除字串中的 <script> 標籤及其內容 */
export function 移除Script(html: string): string {
  return html.replace(SCRIPT_TAG_RE, '');
}

/** 移除字串中的危險 URI 協定 */
export function 移除危險URI(html: string): string {
  return html.replace(DANGEROUS_URI_RE, 'about:blank');
}

/** 移除字串中的 Inline 事件處理器 */
export function 移除Inline事件(html: string): string {
  return html.replace(INLINE_EVENT_RE, '');
}

/** 檢查字串是否含有危險 HTML 標籤 */
export function 含有危險標籤(html: string): boolean {
  const lower = html.toLowerCase();
  return DANGEROUS_TAGS.some((tag) => lower.includes(`<${tag}`));
}

/**
 * L1 安全過濾三合一
 * 按順序：移除 script → 移除危險 URI → 移除 inline 事件
 */
export function 安全過濾(html: string): string {
  let result = html;
  result = 移除Script(result);
  result = 移除危險URI(result);
  result = 移除Inline事件(result);
  return result;
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
      result[key] = 安全過濾Cube(value);
      // 特別檢查 onXXX 開頭的 key（如 dangerouslySetInnerHTML）
      if (/^on\w+$/i.test(key)) {
        delete result[key];
      }
    }
    return result;
  }
  return cube;
}

// ── 完整性雜湊 ──

/** 從環境變數取得 SECRET_KEY，若無則使用預設值 */
function 取得密鑰(): string {
  return Deno.env.get('SECRET_KEY') || 'webcube-default-secret-key-do-not-use-in-production';
}

/**
 * 計算 Cube JSON 的完整性雜湊
 * 在 AI 審查通過後呼叫，將結果存入方塊.已檢驗
 */
export async function 計算完整性雜湊(cubeData: Record<string, unknown>): Promise<string> {
  const 密鑰 = 取得密鑰();
  const 內容 = JSON.stringify(cubeData) + 密鑰;
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