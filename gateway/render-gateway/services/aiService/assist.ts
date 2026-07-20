// AI 小幫手 — 通用表單輔助端點
// 提供硬體推測、翻譯填空、內容建議、自訂提示 四大功能
// 路由 /api/v1/ai/assist/*

import { Context } from 'hono';
import { AIPoolManager } from './pool.ts';
import { 載入提示詞 } from './task/提示詞載入器.ts';

// ── 內建備用系統提示詞（DB 優先）──

const DEFAULT_HARDWARE = `你是電腦硬體規格專家。根據使用者輸入的 CPU 或硬體描述，補齊完整的硬體規格。

規則：
1. 根據 CPU 型號推測是否有內顯、建議搭配的 GPU
2. 推測合理的 RAM 規格
3. 估算適合跑 LLM 推理的能力值 (1-10)
4. 只回傳 JSON：
{
  "CPU": "Intel i9-13900K",
  "GPU": "RTX 4090 24GB",
  "RAM": "64GB DDR5",
  "硬體描述": "Intel i9-13900K, 64GB DDR5, RTX 4090 24GB",
  "建議能力值": 9
}
5. 如果使用者只輸入 CPU 型號，根據該 CPU 的定位推測合理的 GPU 和 RAM
6. 如果使用者輸入的資訊有誤，以你的知識修正並在"備註"欄說明`;

const DEFAULT_TRANSLATE = `你是專業的多國語言翻譯專家。將使用者提供的欄位內容逐一翻譯成目標語言。

規則：
1. 保持原文中的標記符號不變（如 {name}, <b>, %s 等）
2. 翻譯要自然流暢
3. 只回傳 JSON 格式：{ "欄位key": "翻譯結果" }
4. 逐一翻譯每個欄位`;

const DEFAULT_CONTEXT = `你是內容建議專家。根據使用者已填寫的欄位，為空白或需要協助的欄位提供建議內容。

規則：
1. 分析已填欄位的上下文脈絡
2. 為未填或標記為需要協助的欄位生成合理內容
3. 回傳 JSON：{ "欄位key": "建議內容" }
4. 不覆蓋使用者已填寫的內容，除非明確標記為需要修改`;

// ── 公開處理函數 ──

/** 根據路徑分發給對應的處理器 */
export async function 處理Assist請求(c: Context): Promise<Response> {
  const path = c.req.path.replace('/api/v1/ai/assist', '');

  try {
    switch (path) {
      case '/hardware':   return 硬體推測(c);
      case '/translate':  return 翻譯填空(c);
      case '/context':    return 內容建議(c);
      case '':            return 自訂提示(c);
      default:
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: `未知的小幫手端點: ${path}` } }, 404);
    }
  } catch (err) {
    return c.json({ success: false, error: { code: 'ASSIST_ERROR', message: String(err) } }, 500);
  }
}

// ── 內建處理器 ──

/** POST /assist/hardware — 硬體規格推測 */
async function 硬體推測(c: Context): Promise<Response> {
  const body = await c.req.json();
  const cpu = (body.cpu as string) || (body.CPU as string) || '';
  const 描述 = (body.硬體描述 as string) || '';

  const userMsg = [
    cpu ? `CPU: ${cpu}` : '',
    描述 ? `既有描述: ${描述}` : '',
  ].filter(Boolean).join('\n') || '請根據常見配置推薦';

  const pool = new AIPoolManager(c);
  const prompt = await 載入提示詞(c, 'AI提示詞:AI提示詞:assist-hardware', DEFAULT_HARDWARE);
  const { 回應 } = await pool.聊天(
    prompt,
    [{ 角色: 'user', 內容: userMsg }],
    undefined,
    { maxTokens: 512, temperature: 0.2 }
  );

  return 解析JSON回應(c, 回應.內容);
}

/** POST /assist/translate — 多語言翻譯填空 */
async function 翻譯填空(c: Context): Promise<Response> {
  const body = await c.req.json();
  const 欄位 = body.欄位 as Record<string, string> || {};
  const sourceLang = (body.sourceLang as string) || 'zh-tw';
  const targetLangs = (body.targetLangs as string[]) || ['en'];

  const 欄位列表 = Object.entries(欄位)
    .map(([k, v]) => `${k}: "${v}"`)
    .join('\n');

  const pool = new AIPoolManager(c);
  const prompt = await 載入提示詞(c, 'AI提示詞:AI提示詞:assist-translate', DEFAULT_TRANSLATE);
  const { 回應 } = await pool.聊天(
    prompt,
    [{ 角色: 'user', 內容: `從 ${sourceLang} 翻譯成 ${targetLangs.join(', ')}:\n${欄位列表}` }],
    undefined,
    { maxTokens: 1024, temperature: 0.3 }
  );

  return 解析JSON回應(c, 回應.內容);
}

/** POST /assist/context — 內容建議 */
async function 內容建議(c: Context): Promise<Response> {
  const body = await c.req.json();
  const 欄位 = body.欄位 as Record<string, string> || {};
  const 任務 = (body.任務 as string) || '幫我補齊未填寫的欄位';

  const 欄位列表 = Object.entries(欄位)
    .map(([k, v]) => `${k}: ${v || '(空白)'}`)
    .join('\n');

  const pool = new AIPoolManager(c);
  const prompt = await 載入提示詞(c, 'AI提示詞:AI提示詞:assist-context', DEFAULT_CONTEXT);
  const { 回應 } = await pool.聊天(
    prompt,
    [{ 角色: 'user', 內容: `任務: ${任務}\n\n目前欄位:\n${欄位列表}` }],
    undefined,
    { maxTokens: 1024, temperature: 0.7 }
  );

  return 解析JSON回應(c, 回應.內容);
}

/** POST /assist — 自訂提示（使用者自行帶 prompt） */
async function 自訂提示(c: Context): Promise<Response> {
  const body = await c.req.json();
  const 系統提示 = (body.系統提示 as string) || '';
  const 訊息 = (body.訊息 as string) || '';
  const maxTokens = (body.maxTokens as number) || 1024;
  const temperature = (body.temperature as number) ?? 0.7;

  if (!系統提示 || !訊息) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: '自訂模式需提供 系統提示 和 訊息' },
    }, 400);
  }

  const pool = new AIPoolManager(c);
  const { 回應 } = await pool.聊天(
    系統提示,
    [{ 角色: 'user', 內容: 訊息 }],
    undefined,
    { maxTokens, temperature }
  );

  return 解析JSON回應(c, 回應.內容);
}

// ── 工具函數 ──

/** 嘗試從 AI 回應中解析 JSON，失敗則回傳原始文字 */
function 解析JSON回應(c: Context, 內容: string): Response {
  const jsonMatch = 內容.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return c.json({ success: true, data: JSON.parse(jsonMatch[0]) });
    } catch { /* fall through */ }
  }

  const arrMatch = 內容.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return c.json({ success: true, data: JSON.parse(arrMatch[0]) });
    } catch { /* fall through */ }
  }

  return c.json({ success: true, data: { 原始回應: 內容 } });
}
