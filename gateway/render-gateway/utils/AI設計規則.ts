// /utils/AI設計規則.ts — AI 提示詞注入規則庫
// 從 docs/方塊設計指南.md、docs/佈景主題設計指南.md、docs/頁面設計指南.md
// 萃取 AI 必須知道的關鍵規則，在每次生成時注入系統提示詞。
//
// 設計原則：
//   - 只包含「AI 常犯的錯誤」對應的規則
//   - 精簡但完整，不直接複製整份設計指南
//   - 每個區塊注入到對應的 generator（方塊/頁面/風格）

// ═══════════════════════════════════════════════════════════════════════
//  通用規則（所有 generator 都注入）
// ═══════════════════════════════════════════════════════════════════════

export const 通用設計規則 = `
═══ 通用設計規則（所有生成任務都必須遵守） ═══

【多國語言】
- 所有對外文字（標題、描述、text、按鈕文字）必須同時提供 zh-tw 和 en
- 格式：{ "zh-tw": "繁體中文", "en": "English" }

【顏色系統】
- ❌ 嚴禁使用任意顏色值：text-[#ff0000]、bg-blue-500、bg-[#xxx]
- ✅ 使用 color 參數，可選值：primary | secondary | accent | neutral | info | success | warning | error | ghost
- 系統會自動透過 OKLCH 變數供電，無需手動指定色彩
- 可用 CSS class 清單：GET /api/v1/unocss/classes（只使用 API 回傳的 class，嚴禁憑空編造）

【圓角系統】
- ❌ 嚴禁寫死 rounded-sm、rounded-lg、rounded-full、rounded-none
- ✅ 使用 rounded 參數，可選值：sm | md | lg
- 圓角大小由佈景主題的「骨架」模組統一管轄

【間距系統】
- padding / gap 使用 Token 值：xs | sm | md | lg | xl
- 不對應絕對像素值，由骨架模組統一映射為 CSS 變數

【安全性】
- ❌ 禁止 <script>、<iframe>、<embed>、<object>、<applet> 標籤
- ❌ 禁止 javascript:、data:、vbscript: URI
- ❌ 禁止 inline event handlers（onclick、onerror 等）
- ❌ 禁止 dangerouslySetInnerHTML

【JSON 格式】
- 只回傳純 JSON，不要用 \`\`\`json 或任何 Markdown 標記包裝
- 不要加入解釋文字或註解
`;

// ═══════════════════════════════════════════════════════════════════════
//  方塊規則（cube-generator 注入）
// ═══════════════════════════════════════════════════════════════════════

export const 方塊設計規則 = `
═══ 方塊設計規則 ═══

【核心原則】
- 每個方塊 JSON 最終只渲染出一個 HTML 標籤（零垃圾 Wrapper）
- from 決定靈魂（屬性繼承來源），tag 決定肉身（最終 HTML 標籤）

【from 欄位】
- from 是必填欄位
- from 可以是原生標籤（"div"、"span"、"ul"、"a"、"h1"~"h6"、"p"、"img" 等）或方塊 ID（"方塊:方塊:容器"）
- ❌ from 不能指向自己（不能 from 等於自己的 id）

【defaults vs args】
- defaults：內部鎖定值，不給使用者修改（如頁尾永遠 border: "none"）
- args：對外開放的使用者可調參數
- ⚠️ 同一個 key 不能同時出現在 defaults 和 args 中

【變體設計（Variants）】
- 當屬性需要跟隨 arg 變化時（如 size=sm 配 rounded=sm），使用 variants 定義
- ❌ 不要把變體值寫在 className 字串中
- ✅ 範例：variants: { "sm": { "rounded": "sm", "padding": "xs" }, "lg": { "rounded": "lg", "padding": "md" } }
- 子方塊繼承父方塊的 arg 時，只宣告 arg（含 type/default），不重複寫 variants

【五態系統（active/hover/selected/focus）】
- ❌ 不要在 className 中用三元運算子寫狀態樣式
- ✅ 傳遞 active / hover / selected / focus 屬性（Boolean 或 Alpine 表達式）
- 狀態樣式由佈景主題的「風格」模組的 [data-active] 選擇器自動接管
- hover/selected/focus 是疊加態（在 active 基礎上），token 需帶前綴：hover:xxx、selected:xxx、focus:xxx

【activeStateName】
- 用於動態切換 active 狀態（如選單開關）
- 與 active: "$store.xxx" 表達式互斥，不可同時使用

【顏色供電】
- color 參數自動注入 cube-color-{color} 類名
- 自動啟用佈景主題的 OKLCH 變數供電

【wrap 包裹機制】
- wrap.from="ul" → 子項自動包裹 <li>
- wrap.from="select" → 子項自動包裹 <option>
- prepend/append 可繞過包裹規則

【children 規範】
- children 是陣列（可以是空陣列）
- 每個 child 為物件（方塊定義）或字串（純文字）
- 純文字方塊用 text 屬性：{ "from": "span", "text": { "zh-tw": "文字" } }

【slots 插槽】
- slots 內每個 slot 有 from 和可選的 children
- children 放對應 slot 的名稱（如 "slot": "body"），元素自動注入該 slot
- Card 方塊有 body slot，內容必須透過 children 傳入

【禁用模式】
- ❌ 同時使用 cursor-not-allowed 和 pointer-events-none（互斥）
- ❌ 寫死 bg-transparent 覆蓋 inactive 背景
- ❌ 在 children 中使用 { "$api": ... }（改在 mergedArgs 用 @api）
`;

// ═══════════════════════════════════════════════════════════════════════
//  佈景主題規則（style-generator 注入，部分也注入方塊/頁面生成）
// ═══════════════════════════════════════════════════════════════════════

export const 佈景主題規則 = `
═══ 佈景主題規則 ═══

【六模組架構】
- 佈景主題 = 骨架 + 配色 + 風格 + 動畫 + 裝飾 + 圖示集（六個指針）
- 每個模組獨立存在，主題只儲存 ID 指針
- 圖示集：透過 \`GET /api/v1/icon-set/all\` 查詢可用組合，透過 \`GET /api/v1/icon-set/keys\` 取得標準鍵位清單。
  每個圖示集必須填滿所有標準鍵位（鍵位 → 既有圖示 ID），不可缺漏。

【配色模組】
- 使用 OKLCH 色彩格式："L C H"（如 "60% 0.32 310"）
- 九色系統：主色(--p)、次色(--s)、強調色(--a)、中性色(--n)
  背景色(--b1)、資訊色(--in)、成功色(--su)、警告色(--wa)、錯誤色(--er)

【風格模組（五態 CSS 組合拳）】
- active：基礎激活態（不用前綴，直接寫原子類名）
- inactive：基礎停用態
- hover：疊加態（需 hover: 前綴，如 hover:bg-current-10/15）
- selected：疊加態（需 selected: 前綴）
- focus：疊加態（需 focus: 前綴，如 focus:ring-current）
- 風格不內嵌顏色值，用 text-current / bg-current 等 current token

【骨架模組】
- 掌管幾何 Token：radius-sm/md/lg、spacing-xs/sm/md/lg/xl
- 方塊的 rounded/padding/gap 值對應骨架 Token，不對應絕對像素
`;

// ═══════════════════════════════════════════════════════════════════════
//  頁面規則（page-generator 注入）
// ═══════════════════════════════════════════════════════════════════════

export const 頁面設計規則 = `
═══ 頁面設計規則 ═══

【頁面結構】
- 頁面 JSON：{ 標題, 描述?, 內容, 方塊?, 建議路徑? }
- 內容格式直接對齊 Cube 渲染器：{ direction, gap?, padding?, children }
- children 中每個項目必有 from 欄位
- children 不可為空陣列

【方向與對齊】
- direction：col（垂直）| row（水平），預設 col
- align：start | center | end | stretch
- justify：start | center | end | between | around
- 使用簡寫值（col/row），不要用 column/row（對齊 Cube 變體值）

【使用既有方塊】
- 優先使用系統既有方塊，不要憑空創造不存在的 ID
- 取得完整方塊清單：GET /api/v1/cube（回傳所有可用方塊的 id、名稱、描述、args）
- 設計頁面前應先查詢方塊清單，根據實際可用方塊選用
- 常用方塊：方塊:方塊:容器、方塊:方塊:卡片、方塊:方塊:導覽列、方塊:方塊:頁尾
- 不確定有什麼方塊可用時，使用 "div" + className 原生標籤

【Card 方塊特殊規則】
- Card 有 body slot，內容放 children 中
- ❌ 不要在 Card 頂層放 title/content 屬性（無效）
- ✅ children 中的元素自動注入 body slot

【巢狀結構】
- 巢狀深度上限 10 層
- 使用容器方塊進行巢狀佈局

【SEO】
- 標題必填多國語言
- 建議路徑以 / 開頭
`;

// ═══════════════════════════════════════════════════════════════════════
//  組合函數
// ═══════════════════════════════════════════════════════════════════════

/**
 * 根據生成類型組合完整的 AI 系統提示詞
 */
export function 組合設計規則(類型: '方塊' | '頁面' | '風格' | '配色' | '骨架' | '動畫' | '裝飾' | '圖示集' | '佈景主題'): string {
  const 規則 = [通用設計規則];

  switch (類型) {
    case '方塊':
      規則.push(方塊設計規則);
      規則.push(佈景主題規則);
      break;
    case '頁面':
      規則.push(頁面設計規則);
      規則.push(方塊設計規則); // 頁面也需要知道方塊規則（children 格式等）
      規則.push(佈景主題規則);
      break;
    case '風格':
      規則.push(佈景主題規則);
      break;
    // 模組級生成器：僅需通用規則 + 佈景主題規則（各自 DEFAULT_PROMPT 已有詳細規範）
    case '配色':
    case '骨架':
    case '動畫':
    case '裝飾':
    case '圖示集':
      規則.push(佈景主題規則);
      break;
    case '佈景主題':
      規則.push(佈景主題規則);
      規則.push(頁面設計規則); // 佈景主題也可能涉及頁面結構（骨架）
      break;
  }

  return 規則.join('\n');
}
