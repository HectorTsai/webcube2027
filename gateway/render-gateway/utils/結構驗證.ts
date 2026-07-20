// /utils/結構驗證.ts — AI 生成結果的結構驗證器
// 定義 Cube、Page、Style 的基礎結構檢查，
// 讓 AI 在自我修正迴圈中能看到具體的錯誤並修正。
//
// 驗證器簽名： (json: unknown) => string | null
//   回傳 null = 通過，字串 = 人類可讀的錯誤描述（會餵回給 AI）

// ── 通用輔助 ──

function 是物件(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function 是陣列(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function 是字串(v: unknown): v is string {
  return typeof v === 'string';
}

function 是多國語言物件(v: unknown): boolean {
  if (!是物件(v)) return false;
  const keys = Object.keys(v);
  // 至少要有 zh-tw 或 en 其中一個
  return keys.includes('zh-tw') || keys.includes('en');
}

// ── 危險內容檢查 ──

const ARBITRARY_PATTERN = /\[[a-zA-Z0-9#()%._\-\s]+\]/;
const DANGEROUS_TAG_PATTERN = /<(script|iframe|embed|object|applet)\b/i;
const DANGEROUS_URI_PATTERN = /(javascript|data|vbscript):/i;
const INLINE_EVENT_PATTERN = /\bon(click|load|error|mouseover|submit|change|input|focus|blur|keydown|keyup)\s*=/i;

// ── UnoCSS 禁令 ──

const FORBIDDEN_UNOCSS_PATTERNS = [
  /text-\[#/,     // 禁止 arbitrary color（應使用 color 參數）
  /bg-\[#/,       // 禁止 arbitrary background
  /border-\[#/,   // 禁止 arbitrary border
];

// ═══════════════════════════════════════════════════════════════════════
//  方塊 (Cube) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證方塊結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  // ── 頂層型別檢查 ──
  if (!是物件(json) && !是陣列(json)) {
    return '最外層必須是 JSON 物件或 JSON 陣列';
  }

  // 如果是陣列，逐個檢查
  const 方塊列表 = 是陣列(json) ? json : [json];

  for (let i = 0; i < 方塊列表.length; i++) {
    const cube = 方塊列表[i];
    if (!是物件(cube)) {
      錯誤.push(`方塊[${i}] 必須是 JSON 物件`);
      continue;
    }
    錯誤.push(...驗證單一方塊(cube, 方塊列表.length > 1 ? `方塊[${i}]` : '方塊'));
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

function 驗證單一方塊(cube: Record<string, unknown>, 前綴: string): string[] {
  const 錯誤: string[] = [];

  // ── from 欄位 ──
  if (!cube.from) {
    錯誤.push(`${前綴} 缺少必要欄位 "from"（必須指定標籤或方塊 ID）`);
  } else if (!是字串(cube.from)) {
    錯誤.push(`${前綴} 的 "from" 必須是字串`);
  } else if (cube.from === cube.id) {
    錯誤.push(`${前綴} 的 "from" 不能指向自己（"${cube.from}"），請改用 "方塊:方塊:容器" 或其他方塊`);
  }

  // ── children 欄位 ──
  if (cube.children !== undefined && cube.children !== null) {
    if (!是陣列(cube.children)) {
      錯誤.push(`${前綴} 的 "children" 必須是陣列`);
    } else if (cube.children.length === 0) {
      // 空 children 是合法的（無子元素的 div），不報錯
    } else {
      // 檢查 children 中的每個元素
      for (let j = 0; j < (cube.children as unknown[]).length; j++) {
        const child = (cube.children as unknown[])[j];
        if (是字串(child)) continue; // 純文字合法
        if (是物件(child)) {
          // 巢狀檢查（只檢查一層，遞迴由 Cube.tsx 渲染時處理）
          if (!child.from) {
            錯誤.push(`${前綴}.children[${j}] 缺少 "from" 欄位`);
          }
          if (child.children !== undefined && !是陣列(child.children)) {
            錯誤.push(`${前綴}.children[${j}] 的 "children" 必須是陣列`);
          }
          // 檢查 UnoCSS 禁令
          if (是字串(child.className)) {
            const classNameError = 檢查UnoCSS禁令(child.className);
            if (classNameError) {
              錯誤.push(`${前綴}.children[${j}].className ${classNameError}`);
            }
          }
        } else {
          錯誤.push(`${前綴}.children[${j}] 必須是物件（方塊定義）或字串（純文字）`);
        }
      }
    }
  }

  // ── args 與 defaults 的 key 不得重疊 ──
  if (是物件(cube.args) && 是物件(cube.defaults)) {
    const argsKeys = Object.keys(cube.args);
    const defaultsKeys = Object.keys(cube.defaults);
    const 重疊 = argsKeys.filter((k) => defaultsKeys.includes(k));
    if (重疊.length > 0) {
      錯誤.push(`${前綴} 的 "args" 和 "defaults" 有重疊的 key：${重疊.join(', ')}。defaults 是內部鎖定值，不可同時出現在 args 中。`);
    }
  }

  // ── UnoCSS 禁令 ──
  if (是字串(cube.className)) {
    const classNameError = 檢查UnoCSS禁令(cube.className);
    if (classNameError) {
      錯誤.push(`${前綴}.className ${classNameError}`);
    }
  }

  // ── 文字內容 (text) ──
  // 如果是純文字方塊（from 是原生標籤），text 應該是多國語言物件或字串
  if (cube.text !== undefined && cube.text !== null) {
    if (!是字串(cube.text) && !是多國語言物件(cube.text)) {
      錯誤.push(`${前綴} 的 "text" 必須是字串，或多國語言格式 { "zh-tw": "...", "en": "..." }`);
    }
  }

  // ── slots 欄位 ──
  if (是物件(cube.slots)) {
    for (const [slotName, slotDef] of Object.entries(cube.slots)) {
      if (!是物件(slotDef)) {
        錯誤.push(`${前綴}.slots.${slotName} 必須是物件`);
        continue;
      }
      if (!slotDef.from) {
        錯誤.push(`${前綴}.slots.${slotName} 缺少 "from" 欄位`);
      }
    }
  }

  // ── wrap 欄位 ──
  if (是物件(cube.wrap)) {
    if (!cube.wrap.from) {
      錯誤.push(`${前綴}.wrap 缺少 "from" 欄位`);
    }
  }

  // ── 安全性：dangerous 內容 ──
  const jsonStr = JSON.stringify(cube);
  if (DANGEROUS_TAG_PATTERN.test(jsonStr)) {
    錯誤.push(`${前綴} 包含危險 HTML 標籤（<script>/<iframe>/<embed>/<object>/<applet>），請移除`);
  }
  if (DANGEROUS_URI_PATTERN.test(jsonStr)) {
    錯誤.push(`${前綴} 包含危險 URI 協定（javascript:/data:/vbscript:），請移除`);
  }
  if (是物件(cube.on)) {
    for (const key of Object.keys(cube.on)) {
      if (INLINE_EVENT_PATTERN.test(key) || (是字串(cube.on[key]) && INLINE_EVENT_PATTERN.test(cube.on[key]!))) {
        錯誤.push(`${前綴} 包含 inline event handler，請使用 Alpine.js x-on 或 @ 語法替代`);
      }
    }
  }

  return 錯誤;
}

// ═══════════════════════════════════════════════════════════════════════
//  頁面 (Page) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證頁面結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  if (!是物件(json)) {
    return '頁面回應必須是 JSON 物件';
  }

  // ── 標題 ──
  if (json.標題 === undefined) {
    錯誤.push('缺少 "標題" 欄位（必須是多國語言格式 { "zh-tw": "...", "en": "..." }）');
  } else if (!是多國語言物件(json.標題)) {
    錯誤.push('"標題" 必須是多國語言格式，例如 { "zh-tw": "首頁", "en": "Home" }');
  }

  // ── 內容 ──
  if (!json.內容) {
    錯誤.push('缺少 "內容" 欄位');
  } else if (!是物件(json.內容)) {
    錯誤.push('"內容" 必須是物件');
  } else {
    const 內容 = json.內容;

    if (!內容.direction) {
      // direction 可選（使用預設值），不強制報錯
    }

    if (!內容.children) {
      錯誤.push('"內容.children" 為空，頁面沒有任何內容。請至少加入一個方塊（例如標題或卡片）');
    } else if (!是陣列(內容.children)) {
      錯誤.push('"內容.children" 必須是陣列');
    } else if ((內容.children as unknown[]).length === 0) {
      錯誤.push('"內容.children" 是空陣列，頁面沒有任何內容。請至少加入一個方塊');
    } else {
      for (let i = 0; i < (內容.children as unknown[]).length; i++) {
        const child = (內容.children as unknown[])[i];
        if (!是物件(child)) {
          錯誤.push(`內容.children[${i}] 必須是物件（方塊定義）`);
        } else if (!child.from) {
          錯誤.push(`內容.children[${i}] 缺少 "from" 欄位（必須指定要使用哪個方塊）`);
        }
      }
    }

    // ── 檢查 gap ──
    if (內容.gap !== undefined && !是字串(內容.gap)) {
      錯誤.push('"內容.gap" 必須是字串（如 "sm"、"md"、"lg"）');
    }
  }

  // ── 建議路徑 ──
  if (json.建議路徑 !== undefined && !是字串(json.建議路徑)) {
    錯誤.push('"建議路徑" 必須是字串');
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

// ═══════════════════════════════════════════════════════════════════════
//  風格 (Style) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證風格結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  if (!是物件(json)) {
    return '風格回應必須是 JSON 物件';
  }

  if (!json.名稱) {
    錯誤.push('缺少 "名稱" 欄位（必須是多國語言格式）');
  } else if (!是多國語言物件(json.名稱)) {
    錯誤.push('"名稱" 必須是多國語言格式，例如 { "zh-tw": "玻璃幻境", "en": "Glass Morph" }');
  }

  if (!json.配置) {
    錯誤.push('缺少 "配置" 欄位');
  } else if (!是物件(json.配置)) {
    錯誤.push('"配置" 必須是物件，包含 CSS 變數定義（如 gradient、shadow、border 等）');
  } else {
    const configKeys = Object.keys(json.配置);
    if (configKeys.length === 0) {
      錯誤.push('"配置" 是空的，請至少定義一個 CSS 變數（如 gradient 或 shadow）');
    }
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

// ═══════════════════════════════════════════════════════════════════════
//  佈景主題 (Theme) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證佈景主題結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  if (!是物件(json)) {
    return '佈景主題回應必須是 JSON 物件';
  }

  if (!json.名稱) {
    錯誤.push('缺少 "名稱" 欄位（必須是多國語言格式 { "zh-tw": "...", "en": "..." }）');
  } else if (!是多國語言物件(json.名稱)) {
    錯誤.push('"名稱" 必須是多國語言格式，例如 { "zh-tw": "咖啡店", "en": "Cafe" }');
  }

  // 六大金剛：配色、骨架、風格、動畫、裝飾、圖示
  const 六大金剛 = ['配色', '骨架', '風格', '動畫', '裝飾', '圖示'] as const;
  for (const 金剛 of 六大金剛) {
    if (!json[金剛]) {
      錯誤.push(`缺少 "${金剛}" 欄位（必須指定已存在的 ${金剛} ID）`);
    } else if (!是字串(json[金剛])) {
      錯誤.push(`"${金剛}" 必須是字串（${金剛} 的完整 ID）`);
    }
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

// ═══════════════════════════════════════════════════════════════════════
//  圖示集 (Icon Set) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證圖示集結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  if (!是物件(json)) {
    return '圖示集回應必須是 JSON 物件';
  }

  if (!json.名稱) {
    錯誤.push('缺少 "名稱" 欄位（必須是多國語言格式 { "zh-tw": "...", "en": "..." }）');
  } else if (!是多國語言物件(json.名稱)) {
    錯誤.push('"名稱" 必須是多國語言格式');
  }

  if (!json.圖示映射) {
    錯誤.push('缺少 "圖示映射" 欄位（必須是 14 個標準鍵位的對照表）');
  } else if (!是物件(json.圖示映射)) {
    錯誤.push('"圖示映射" 必須是物件（鍵位 → 圖示 ID）');
  } else {
    const 映射 = json.圖示映射 as Record<string, unknown>;
    const 標準鍵位 = ['首頁', '選單', '新增', '關閉', '確認', '取消', '搜尋', '使用者', '設定', '主題', '配色', '骨架', '圖示', '圖示集'];
    for (const 鍵 of 標準鍵位) {
      if (!映射[鍵]) {
        錯誤.push(`圖示映射缺少 "${鍵}" 鍵位（14 個標準鍵位必須全填滿）`);
      } else if (!是字串(映射[鍵])) {
        錯誤.push(`圖示映射的 "${鍵}" 必須是字串（圖示 ID）`);
      }
    }
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

// ═══════════════════════════════════════════════════════════════════════
//  UnoCSS 禁令檢查
// ═══════════════════════════════════════════════════════════════════════

function 檢查UnoCSS禁令(className: string): string | null {
  for (const pattern of FORBIDDEN_UNOCSS_PATTERNS) {
    if (pattern.test(className)) {
      return `使用了禁止的 arbitrary value 語法（如 text-[#...]、bg-[#...]）。請改用 color 參數（支援 primary/secondary/accent/neutral/info/success/warning/error/ghost），或使用 UnoCSS 預設的顏色類名`;
    }
  }

  // 檢查動態條件類名（不該在 className 中寫三元運算子）
  if (className.includes('?') && (className.includes(':') || className.includes('active'))) {
    return 'className 包含條件判斷（? :），請改用 active / hover / selected / focus 屬性，讓佈景主題系統接管狀態樣式';
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
//  配色 (Color) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證配色結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  if (!是物件(json)) return '配色回應必須是 JSON 物件';

  if (!json.名稱 || !是多國語言物件(json.名稱)) {
    錯誤.push('缺少 "名稱" 欄位（必須是多國語言格式）');
  }

  const 色值欄位 = ['主色', '次色', '強調色', '中性色', '背景色', '資訊色', '成功色', '警告色', '錯誤色'];
  for (const 欄 of 色值欄位) {
    const 值 = (json as Record<string, unknown>)[欄];
    if (!值 || !是字串(值)) {
      錯誤.push(`缺少 "${欄}" 欄位或不是字串（必須為 OKLCH 格式）`);
    } else {
      // 檢查 OKLCH 格式：至少包含 3 個數值段
      const parts = (值 as string).trim().split(/\s+/);
      if (parts.length < 3) {
        錯誤.push(`"${欄}" 的值 "${值}" 不是有效的 OKLCH 格式（應為 "L% C h"）`);
      }
    }
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

// ═══════════════════════════════════════════════════════════════════════
//  骨架 (Skeleton) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證骨架結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  if (!是物件(json)) return '骨架回應必須是 JSON 物件';

  if (!json.名稱 || !是多國語言物件(json.名稱)) {
    錯誤.push('缺少 "名稱" 欄位（必須是多國語言格式）');
  }

  if (!json.配置 || !是物件(json.配置)) {
    錯誤.push('缺少 "配置" 欄位（必須是物件，包含 CSS Token）');
    return 錯誤.join('\n');
  }

  const 配置 = json.配置 as Record<string, unknown>;
  const 必要Token = [
    'radius-sm', 'radius-md', 'radius-lg', 'radius-avatar',
    'spacing-xs', 'spacing-sm', 'spacing-md', 'spacing-lg', 'spacing-xl', 'spacing-2xl',
    'font-xs', 'font-sm', 'font-md', 'font-lg', 'font-xl', 'font-2xl',
    'font-3xl', 'font-4xl', 'font-5xl', 'font-6xl', 'font-7xl', 'font-8xl', 'font-9xl',
    'border-sm', 'border-md', 'border-lg',
    'icon-xs', 'icon-sm', 'icon-md', 'icon-lg',
    'image-sm', 'image-md', 'image-lg', 'image-xl', 'image-2xl', 'image-3xl',
    'image-4xl', 'image-5xl', 'image-6xl', 'image-7xl', 'image-8xl', 'image-9xl',
  ];

  for (const token of 必要Token) {
    if (!配置[token]) {
      錯誤.push(`配置缺少 "${token}" Token`);
    }
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

// ═══════════════════════════════════════════════════════════════════════
//  動畫 (Animate) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證動畫結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  if (!是物件(json)) return '動畫回應必須是 JSON 物件';

  if (!json.名稱 || !是多國語言物件(json.名稱)) {
    錯誤.push('缺少 "名稱" 欄位（必須是多國語言格式）');
  }

  if (!json.配置 || !是物件(json.配置)) {
    錯誤.push('缺少 "配置" 欄位（必須是物件，包含動畫類名映射）');
    return 錯誤.join('\n');
  }

  const 配置 = json.配置 as Record<string, unknown>;
  const 必要場景 = [
    '下拉選單:開', '下拉選單:關',
    '抽屜:上:開', '抽屜:上:關',
    '抽屜:下:開', '抽屜:下:關',
    '抽屜:左:開', '抽屜:左:關',
    '抽屜:右:開', '抽屜:右:關',
    '視窗:開', '視窗:關',
    '彈出:開', '彈出:關',
    '折疊面板:開', '折疊面板:關',
    '吐司訊息:進場', '吐司訊息:出場',
  ];

  for (const 場景 of 必要場景) {
    if (!配置[場景]) {
      錯誤.push(`配置缺少 "${場景}" 動畫場景`);
    } else if (!是字串(配置[場景])) {
      錯誤.push(`"${場景}" 的值必須是字串（Animate.css 類名）`);
    }
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

// ═══════════════════════════════════════════════════════════════════════
//  裝飾 (Ornament) 結構驗證
// ═══════════════════════════════════════════════════════════════════════

export function 驗證裝飾結構(json: unknown): string | null {
  const 錯誤: string[] = [];

  if (!是物件(json)) return '裝飾回應必須是 JSON 物件';

  if (!json.名稱 || !是多國語言物件(json.名稱)) {
    錯誤.push('缺少 "名稱" 欄位（必須是多國語言格式）');
  }

  if (!json.配置 || !是物件(json.配置)) {
    錯誤.push('缺少 "配置" 欄位（必須是物件，包含裝飾位置映射）');
    return 錯誤.join('\n');
  }

  const 裝飾配置 = json.配置 as Record<string, unknown>;
  const 必要位置 = [
    'container-top-left', 'container-top-right',
    'container-bottom-left', 'container-bottom-right',
    'page-watermark',
    'card-ornament',
    'badge-top-left', 'badge-top-right',
  ];

  for (const 位置 of 必要位置) {
    if (!(位置 in 裝飾配置)) {
      錯誤.push(`配置缺少 "${位置}" 裝飾位置`);
    }
  }

  return 錯誤.length > 0 ? 錯誤.join('\n') : null;
}

// ═══════════════════════════════════════════════════════════════════════
//  組合驗證器（同時檢查多個維度）
// ═══════════════════════════════════════════════════════════════════════
export function 組合驗證器(...驗證器們: 驗證器[]): 驗證器 {
  return (json: unknown): string | null => {
    for (const 驗證 of 驗證器們) {
      const 錯誤 = 驗證(json);
      if (錯誤 !== null) return 錯誤;
    }
    return null;
  };
}

// 從自我修正模組重新匯出型別（避免循環引用）
import type { 驗證器 } from './自我修正.ts';
