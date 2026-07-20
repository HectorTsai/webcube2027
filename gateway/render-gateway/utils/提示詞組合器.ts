// /utils/提示詞組合器.ts — 將任務提示詞 + 設計規則 + 預取上下文組合為完整的 AI 系統提示詞
//
// 💰 LLM Prompt Caching 最佳化：
//   設計規則（最長固定前綴）→ 預取上下文（方塊清單/CSS classes，半固定）
//   → 任務提示詞（變動）→ 使用者訊息（每次不同）
//
//   LLM provider 的前綴匹配機制會自動 cache 設計規則 + 預取上下文，
//   大幅降低重複 token 費用（預估節省 50-70% 輸入 token）
//
// 📋 依生成類型精準分配清單：
//   方塊       → CSS classes
//   頁面       → 方塊清單 + CSS classes
//   風格       → CSS classes + 配色清單
//   佈景主題   → CSS classes + 配色 + 骨架 + 風格 + 動畫 + 裝飾 + 圖示集（六大金剛）
//
// 使用方式：
//   import { 組合提示詞 } from '...';
//   const prompt = await 組合提示詞(c, 'AI提示詞:AI提示詞:cube-generator', DEFAULT_PROMPT, '方塊');

import { Context } from 'hono';
import { 載入提示詞 } from '../services/aiService/task/提示詞載入器.ts';
import { 組合設計規則 } from './AI設計規則.ts';
import { InnerAPI } from '../services/index.ts';
import { info, warn } from './logger.ts';

export type 生成類型 = '方塊' | '頁面' | '風格' | '配色' | '骨架' | '動畫' | '裝飾' | '圖示集' | '佈景主題';

// ── 模組級輕量快取（60s TTL） ──
interface 快取條目 {
  data: string;
  timestamp: number;
}
const 上下文快取 = new Map<string, 快取條目>();
const 快取TTL = 60_000; // 60 秒

function 取得快取(鍵: string): string | null {
  const 條目 = 上下文快取.get(鍵);
  if (!條目) return null;
  if (Date.now() - 條目.timestamp > 快取TTL) {
    上下文快取.delete(鍵);
    return null;
  }
  return 條目.data;
}

function 設定快取(鍵: string, data: string): void {
  上下文快取.set(鍵, { data, timestamp: Date.now() });
}

// ── 通用列表撈取 ──

/**
 * 從指定 API 端點撈取列表，並格式化為 AI 可讀的簡潔清單
 * @param c     Hono Context
 * @param path  API 路徑（如 '/api/v1/color/all'）
 * @param 模組名稱  中文模組名稱（如 '配色'）
 * @param 描述  說明文字
 */
async function 撈取列表(
  c: Context,
  path: string,
  模組名稱: string,
  描述: string,
): Promise<string> {
  const res = await InnerAPI(c, path);
  const body = await res.json();

  if (body.success && Array.isArray(body.data) && body.data.length > 0) {
    const items = body.data.map((item: Record<string, unknown>) => {
      const id = String(item.id || item._id || '');
      const 名稱 = String(item.名稱 || item.title || item.name || '');
      const desc = String(item.描述 || item.description || '');
      return desc ? `- ${id}｜${名稱}｜${desc}` : `- ${id}｜${名稱}`;
    }).join('\n');

    return `【可用${模組名稱}清單】（來自 ${path}）\n\n${描述}：\n${items}`;
  }

  return `⚠️ 目前尚無${模組名稱}可用。`;
}

// ── 特定清單 ──

/** 撈取方塊清單（租戶隔離） */
function 撈取方塊清單(c: Context): Promise<string> {
  return 撈取列表(c, '/api/v1/cube', '方塊', '在此專案中，以下方塊可直接使用（優先選用，而非從零創造）。若使用者需求沒有對應的既有方塊，才使用 div + className 做原生結構。');
}

/** 撈取 CSS class 清單（全域共用） */
async function 撈取CSS清單(c: Context): Promise<string> {
  const res = await InnerAPI(c, '/api/v1/unocss/classes');
  const body = await res.json();

  if (body.success && body.data) {
    const 自訂規則 = body.data.自訂規則 || body.data;
    const classNames: string[] = [];

    for (const key of Object.keys(自訂規則)) {
      if (key === 'total') continue;
      const val = 自訂規則[key];
      if (typeof val === 'string') {
        classNames.push(val);
      } else if (Array.isArray(val)) {
        classNames.push(...val);
      } else if (typeof val === 'object' && val !== null) {
        for (const subKey of Object.keys(val)) {
          const subVal = val[subKey];
          if (typeof subVal === 'string') classNames.push(subVal);
          else if (Array.isArray(subVal)) classNames.push(...subVal);
        }
      }
    }

    if (classNames.length > 0) {
      return `【當前可用自訂 CSS Class 清單】（來自 GET /api/v1/unocss/classes）\n\n以下為 WebCube 平台的自訂 UnoCSS class（可與標準 TailwindCSS v4 class 搭配使用）：\n${classNames.map(c => `- ${c}`).join('\n')}\n\n❌ 嚴禁使用不存在於此清單或標準 TailwindCSS v4 中的 class 名稱。`;
    }
  }
  return '⚠️ 目前沒有自訂 CSS class，請僅使用標準 TailwindCSS v4 class。';
}

// ── 類型 → 需求矩陣 ──

interface 需求矩陣 {
  /** 是否需要方塊清單 */
  方塊清單: boolean;
  /** 是否需要 CSS class 清單 */
  CSS: boolean;
  /** 是否需要五大金剛清單（配色/骨架/風格/動畫/裝飾/圖示集列表） */
  五大金剛: boolean;
  /** 是否需要標準圖示鍵位（所有生成器共用，方塊/頁面/風格/佈景主題都會用到圖示） */
  標準圖示鍵位: boolean;
}

function 取得需求矩陣(類型: 生成類型): 需求矩陣 {
  switch (類型) {
    case '方塊':
      return { 方塊清單: true, CSS: true, 五大金剛: false, 標準圖示鍵位: true };
    case '頁面':
      return { 方塊清單: true, CSS: true, 五大金剛: false, 標準圖示鍵位: true };
    case '風格':
      return { 方塊清單: false, CSS: true, 五大金剛: false, 標準圖示鍵位: true };
    case '配色':
      return { 方塊清單: false, CSS: false, 五大金剛: false, 標準圖示鍵位: false };
    case '骨架':
      return { 方塊清單: false, CSS: true, 五大金剛: false, 標準圖示鍵位: true };
    case '動畫':
      return { 方塊清單: false, CSS: false, 五大金剛: false, 標準圖示鍵位: false };
    case '裝飾':
      return { 方塊清單: false, CSS: false, 五大金剛: false, 標準圖示鍵位: false };
    case '圖示集':
      return { 方塊清單: false, CSS: true, 五大金剛: false, 標準圖示鍵位: true };
    case '佈景主題':
      return { 方塊清單: false, CSS: true, 五大金剛: true, 標準圖示鍵位: true };
  }
}

// ── 預取上下文 ──

/**
 * 根據生成類型，預先撈取 AI 需要的上下文資料
 *
 * 設計意圖：AI 在設計指南中被告知要查 API，
 * 但 AI 實際上無法自己呼叫 API。我們在生成前自動撈好，直接注入 prompt。
 */
async function 預取上下文(c: Context, 類型: 生成類型): Promise<string> {
  const 段落: string[] = [];
  const domain = c.get('域名') || 'unknown';
  const 需求 = 取得需求矩陣(類型);

  try {
    // ═══ CSS class 清單（全域共用） ═══
    if (需求.CSS) {
      const cacheKey = 'unocss:classes';
      let cText = 取得快取(cacheKey);
      if (cText === null) {
        cText = await 撈取CSS清單(c);
        設定快取(cacheKey, cText);
      }
      段落.push(cText);
    }

    // ═══ 方塊清單（租戶隔離） ═══
    if (需求.方塊清單) {
      const cacheKey = `${domain}:cube-list`;
      let cText = 取得快取(cacheKey);
      if (cText === null) {
        cText = await 撈取方塊清單(c);
        設定快取(cacheKey, cText);
      }
      段落.push(cText);
    }

    // ═══ 六大金剛清單（佈景主題設計） ═══
    if (需求.五大金剛) {
      const 六大模組: Array<{ path: string; name: string; desc: string; cacheKey: string }> = [
        { path: '/api/v1/color/all',    name: '配色',   desc: '可用色彩方案（OKLCH 格式）', cacheKey: `all:color` },
        { path: '/api/v1/skeleton/all', name: '骨架',   desc: '可用頁面骨架模板',           cacheKey: `all:skeleton` },
        { path: '/api/v1/style/all',    name: '風格',   desc: '可用 CSS 變數風格組合',       cacheKey: `all:style` },
        { path: '/api/v1/animate/all',  name: '動畫',   desc: '可用動畫特效配置',             cacheKey: `all:animate` },
        { path: '/api/v1/ornament/all', name: '裝飾',   desc: '可用節慶/主題裝飾元件',        cacheKey: `all:ornament` },
        { path: '/api/v1/icon-set/all', name: '圖示集', desc: '可用圖示 ID 組合',               cacheKey: `all:icon-set` },
      ];

      for (const m of 六大模組) {
        let tText = 取得快取(m.cacheKey);
        if (tText === null) {
          tText = await 撈取列表(c, m.path, m.name, m.desc);
          設定快取(m.cacheKey, tText);
        }
        段落.push(tText);
      }
    }

    // ═══ 標準圖示鍵位（所有生成器共用） ═══
    if (需求.標準圖示鍵位) {
      const cacheKey = 'icon-set:standard-keys';
      let tText = 取得快取(cacheKey);
      if (tText === null) {
        tText = await 撈取列表(c, '/api/v1/icon-set/keys', '標準圖示鍵位', '系統定義的標準圖示語義鍵位（前端元件依賴這些鍵名查詢圖示，設計方塊/頁面時應參考）');
        設定快取(cacheKey, tText);
      }
      段落.push(tText);
    }

    // ═══ 風格生成：僅需配色（不需全部五大金剛） ═══
    if (類型 === '風格') {
      const cacheKey = 'all:color';
      let tText = 取得快取(cacheKey);
      if (tText === null) {
        tText = await 撈取列表(c, '/api/v1/color/all', '配色', '可用色彩方案（風格定義 CSS 變數時可參考）');
        設定快取(cacheKey, tText);
      }
      段落.push(tText);
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await warn('提示詞組合器', `預取上下文失敗（${類型}）: ${msg}，將跳過預取`);
  }

  return 段落.length > 0 ? `\n\n${段落.join('\n\n')}` : '';
}

// ── 主組合函數 ──

/**
 * 組合完整的 AI 系統提示詞（已最佳化 LLM prompt caching）
 *
 * 💰 提示詞結構（從 cacheable 到 unique）：
 *   1. 設計規則 — 完全固定，LLM cache 100% 命中
 *   2. 預取上下文 — 半固定（60s 本地快取 + LLM cache）
 *   3. 任務提示詞 — 每次變動（僅此段落 + 使用者訊息需計費）
 *
 * @param c            Hono Context（用於 InnerAPI 和快取鍵）
 * @param promptId     提示詞 DB ID（如 "AI提示詞:AI提示詞:cube-generator"）
 * @param fallback     硬編碼備用提示詞（當 DB 無資料時使用）
 * @param 類型         生成類型（決定注入哪些設計規則與預取上下文）
 * @returns            組合後的完整系統提示詞
 */
export async function 組合提示詞(
  c: Context,
  promptId: string,
  fallback: string,
  類型: 生成類型,
): Promise<string> {
  const 設計規則 = 組合設計規則(類型);
  const 上下文 = await 預取上下文(c, 類型);
  const 任務提示詞 = await 載入提示詞(c, promptId, fallback);

  // 固定前綴 → 半固定 → 變動（LLM cache 命中前兩段）
  const 完整提示詞 = `${設計規則}${上下文}\n\n${任務提示詞}`;

  await info('提示詞組合器', `組合完成：類型=${類型}，總長度=${完整提示詞.length} 字元`);
  return 完整提示詞;
}
