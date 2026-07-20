// ═══════════════════════════════════════════════════════════════════════════════
// pipelines/alpinePipeline.ts — Alpine.js 互動語意翻譯管線 (v3 語意版)
// ═══════════════════════════════════════════════════════════════════════════════
//
// 🏛️ 核心哲學（請未來的 AI 務必遵守，嚴禁走回頭路）：
//
//   本管線的唯一職責是「高階語意 → 低階 Alpine 屬性」的純翻譯。
//   它不猜測意圖、不自動偵測、不跨欄位耦合、不產生任何未被 JSON 明確宣告的行為。
//
//   ❌ 嚴禁行為 (Anti-Patterns)：
//      - 禁止根據 className 或 state 欄位自動生成 MQ Guard
//      - 禁止根據 active/hover/focus 等布林值自動推導五態
//      - 禁止在管線內做任何 if(className.includes(...)) 式的隱式耦合
//      - 禁止手動字串拼接 x-init（應使用 安全合併Init）
//      - 禁止新增任何「自動化」行為 — 所有輸出必須來自 JSON 的顯式宣告
//
//   ✅ 允許行為：
//      - 將語意鍵（toggle / drawer / 五態 / layoutObserver）翻譯為 Alpine 屬性
//      - 對未識別的 alpine 鍵做純插值透傳
//      - 使用 安全合併Init 安全合併多個 x-init 來源
//
//   如果未來出現新的互動需求：
//      → 新增一個語意鍵（如 "dropdown"），而不是在管線裡加 if/else 自動偵測
//      → 種子檔中顯式宣告該語意鍵，管線只做翻譯
//
// ═══════════════════════════════════════════════════════════════════════════════

import { 智慧插值 } from "../../utils/安全過濾器.ts";

// ── 模板正則：判斷是否仍有未解析的 {key} 模板 ──
const 模板正則 = /\{[\w\-.\u4e00-\u9fff]+\}/;

// ═══════════════════════════════════════════════════════════════════════════════
// 🛠️ 安全合併工具函數
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 安全合併多個 x-init 語句，防止語法毀損
 * 統一處理分號邊界：移除尾部多餘分號後，以「; 」安全分隔
 */
export function 安全合併Init(existingInit: string | undefined, newInit: string | undefined): string {
  if (!existingInit) return newInit?.trim() || "";
  if (!newInit) return existingInit.trim();
  const cleanBase = existingInit.trim().replace(/;+$/, "");
  const cleanNew = newInit.trim().replace(/;+$/, "");
  return `${cleanBase}; ${cleanNew};`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧩 語意模式翻譯器（每種模式一個純函數，輸入 args 輸出 Alpine 屬性）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔘 toggle — 基於 Alpine.store 的開關模式
 *
 * JSON 宣告：
 *   "alpine": { "toggle": "{state}" }
 *
 * 輸出：
 *   - x-init: 初始化 store（若不存在）
 *   - x-show.important: 綁定 store 值
 *   - x-on:click: 切換 store 值
 */
function 翻譯Toggle(stateName: string, 現有屬性: Record<string, string>): void {
  現有屬性["x-init"] = 安全合併Init(
    現有屬性["x-init"],
    `if(!Alpine.store('drawers')){Alpine.store('drawers',{})}Alpine.store('drawers').${stateName}=Alpine.store('drawers').${stateName}||false`,
  );
  現有屬性["x-show.important"] = `!!($store.drawers && $store.drawers['${stateName}'])`;
  現有屬性["x-on:click"] = `$store.drawers['${stateName}'] = !$store.drawers['${stateName}']`;
}

/**
 * 📐 drawer — 抽屜模式（toggle + transition + layout + MQ Guard）
 *
 * JSON 宣告：
 *   "alpine": { "drawer": "{state}", "drawerPosition": "{position}" }
 *   position: "left" | "right" | "top" | "bottom"（預設 right）
 *
 * 輸出：
 *   - toggle 全組（x-init + x-show + x-on:click）
 *   - x-transition 動畫（依方向自動選用 translate-x / translate-y）
 *   - x-bind:style：layout-aware 定位（navbar/footer 偏移）
 *   - MQ Guard：寬度 ≥ 768px 自動關閉
 */
function 翻譯Drawer(
  stateName: string,
  position: string,
  現有屬性: Record<string, string>,
): void {
  // ① store init + x-show（不含 x-on:click — drawer 本體由按鈕/backdrop 控制開關）
  現有屬性["x-init"] = 安全合併Init(
    現有屬性["x-init"],
    `if(!Alpine.store('drawers')){Alpine.store('drawers',{})}Alpine.store('drawers').${stateName}=Alpine.store('drawers').${stateName}||false`,
  );
  現有屬性["x-show.important"] = `!!($store.drawers && $store.drawers['${stateName}'])`;

  // ② x-transition 動畫（依方向）
  const translateProp = position === "left" || position === "right" ? "translate-x" : "translate-y";

  現有屬性["x-transition:enter"] = "transition ease-in-out duration-300";
  現有屬性["x-transition:enter-start"] = `opacity-0 transform ${translateProp}-full`;
  現有屬性["x-transition:enter-end"] = "opacity-100 transform translate-x-0 translate-y-0";
  現有屬性["x-transition:leave"] = "transition ease-in-out duration-300";
  現有屬性["x-transition:leave-start"] = "opacity-100 transform translate-x-0 translate-y-0";
  現有屬性["x-transition:leave-end"] = `opacity-0 transform ${translateProp}-full`;

  // ③ layout-aware 定位（navbar / footer 偏移）
  現有屬性["x-bind:style"] =
    `(function(){var L=Alpine.store('layout');var n=L?L.navbarHeight||0:0;var f=L?L.footerHeight||0:0;` +
    `if(['left','right'].includes('${position}')){return'top:'+n+'px;height:calc(100vh - '+n+'px'+(f?' - '+f+'px':'')+')'}` +
    `return n?'top:'+n+'px':'top:0'})()`;

  // ④ MQ Guard：桌面端自動收合
  const mqGuard =
    `if(!window.__mq_guard_drawer_${stateName}){` +
    `window.__mq_guard_drawer_${stateName}=true;` +
    `window.matchMedia('(min-width:768px)').addEventListener('change',function(e){` +
    `if(e.matches){if(Alpine.store('drawers')){Alpine.store('drawers')['${stateName}']=false;}}` +
    `});}`;
  現有屬性["x-init"] = 安全合併Init(現有屬性["x-init"], mqGuard);
}

/**
 * 🎨 五態 — 按鈕互動五態（active / hover / focus / selected / disabled）
 *
 * JSON 宣告：
 *   "alpine": { "五態": true }
 *
 * 依賴 localArgs 中的 _五態分類（由 argsPipeline 統一計算），
 * 靜態值輸出 data-* 屬性，動態值（Alpine 表達式）輸出 :data-* 綁定。
 */
function 翻譯五態(
  localArgs: Record<string, unknown>,
  現有屬性: Record<string, string>,
): void {
  const 五態分類 = (localArgs as any)._五態分類 || {};
  const isDynamic = (key: string) => 五態分類[key] === "dynamic";

  const evalStatic = (key: string, defaultVal: boolean): boolean => {
    if (isDynamic(key)) return defaultVal;
    const v = localArgs[key];
    if (v === undefined) return defaultVal;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v === "true" || v === "" ? true : false;
    return Boolean(v);
  };

  const disabled = evalStatic("disabled", false);
  const active = isDynamic("disabled") ? (localArgs.active ?? true) : (disabled ? false : evalStatic("active", true));
  const hover = isDynamic("disabled") ? false : (disabled ? false : evalStatic("hover", false));
  const focus = isDynamic("disabled") ? false : (disabled ? false : evalStatic("focus", true));
  const selected = evalStatic("selected", false);

  // 🎯 activeStateName 動態模式（Container.tsx 相容）— 優先於靜態 data-active
  const activeStateName = localArgs.activeStateName as string | undefined;
  if (activeStateName && typeof activeStateName === "string" && activeStateName.length > 0) {
    // 路徑自動判別：不含 $ 或 . → 自動前綴 $store.Container.
    const storePath = activeStateName.includes("$") || activeStateName.includes(".")
      ? activeStateName
      : `$store.Container.${activeStateName}`;

    現有屬性["x-init"] = 安全合併Init(
      現有屬性["x-init"],
      `if(!Alpine.store('Container')){Alpine.store('Container',{})}if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}`,
    );
    現有屬性["x-bind:data-active"] = `(${storePath} ?? ${active}) ? 'true' : 'false'`;
    現有屬性["x-bind:style"] = `!(${storePath} ?? ${active}) ? '--c-current: var(--color-neutral-raw); --c-current-content: var(--color-neutral-content-raw); --c-current-50: var(--color-neutral-50-raw); --c-current-70: var(--color-neutral-70-raw); --c-current-90: var(--color-neutral-90-raw);' : ''`;
  } else {
    const dynamicDisabled = localArgs["x-bind:disabled"] || localArgs[":disabled"];

    if (dynamicDisabled || isDynamic("disabled")) {
      const expr = dynamicDisabled || String(localArgs.disabled);
      現有屬性["x-bind:data-active"] = `${expr} ? 'false' : 'true'`;
      現有屬性["x-bind:data-hover"] = `${expr} ? 'false' : 'true'`;
    } else {
      現有屬性[isDynamic("active") ? ":data-active" : "data-active"] = String(active);
    }
  }

  現有屬性[isDynamic("hover") ? ":data-hover" : "data-hover"] = String(hover);
  現有屬性[isDynamic("selected") ? ":data-selected" : "data-selected"] = String(selected);
  現有屬性[isDynamic("focus") ? ":data-focus" : "data-focus"] = String(focus);
}

/**
 * 📏 layoutObserver — 量測元素尺寸並寫入 layout store
 *
 * JSON 宣告：
 *   "alpine": { "layoutObserver": "navbarHeight" }   // 或 "footerHeight"
 *
 * 輸出：
 *   - x-init: 建立 ResizeObserver，將元素高度寫入 Alpine.store('layout').{key}
 */
function 翻譯LayoutObserver(storeKey: string, 現有屬性: Record<string, string>): void {
  const observerVar = `_ro_${storeKey}`;
  現有屬性["x-init"] = 安全合併Init(
    現有屬性["x-init"],
    `if(!Alpine.store('layout'))Alpine.store('layout',{});` +
    `Alpine.store('layout').${storeKey}=$el.offsetHeight;` +
    `if(!Alpine.${observerVar}){Alpine.${observerVar}=new ResizeObserver(function(){` +
    `Alpine.store('layout').${storeKey}=$el.offsetHeight});` +
    `Alpine.${observerVar}.observe($el)}`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 主入口：運行互動狀態管線
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 運行互動狀態管線 — 語意模式翻譯 + 純插值透傳
 * @param definition  方塊定義（含 alpine / on / data / declareStores）
 * @param localArgs   由 argsPipeline 產出的當前層私有參數
 * @returns 純 Alpine 屬性物件
 */
export function 運行互動狀態管線(
  definition: any,
  localArgs: Record<string, unknown>,
): Record<string, string> {
  const attrs: Record<string, string> = {};

  // ── 1. 語意模式翻譯 ──
  const alpine = definition.alpine;
  if (alpine) {
    // 1a. toggle 模式
    if (alpine.toggle) {
      const stateName = 智慧插值(alpine.toggle, localArgs);
      if (typeof stateName === "string" && !模板正則.test(stateName)) {
        翻譯Toggle(stateName, attrs);
      }
    }

    // 1b. drawer 模式
    if (alpine.drawer) {
      const stateName = 智慧插值(alpine.drawer, localArgs);
      const position = alpine.drawerPosition
        ? String(智慧插值(alpine.drawerPosition, localArgs))
        : "right";
      if (typeof stateName === "string" && !模板正則.test(stateName)) {
        翻譯Drawer(stateName, position, attrs);
      }
    }

    // 1c. 五態模式
    if (alpine.五態) {
      翻譯五態(localArgs, attrs);
    }

    // 1d. layoutObserver 模式
    if (alpine.layoutObserver) {
      const storeKey = 智慧插值(alpine.layoutObserver, localArgs);
      if (typeof storeKey === "string") {
        翻譯LayoutObserver(storeKey, attrs);
      }
    }
  }

  // ── 2. 變體層 alpine 配置 ──
  //    遍歷 args 的 variants，若有 alpine 區塊也一併處理
  const alpineConfigs: any[] = [];
  if (definition.alpine) alpineConfigs.push(definition.alpine);
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
      const runtimeVal = localArgs[key];
      if (runtimeVal === undefined) continue;
      const v = argDef.variants?.[String(runtimeVal)];
      if (v?.alpine) alpineConfigs.push(v.alpine);
    }
  }

  // ── 3. 純插值透傳（語意模式未覆蓋的 alpine 鍵）──
  //    僅處理 bind / attrs / model / init 四種標準 Alpine 配置
  //    不包含已由語意模式處理的鍵（toggle / drawer / 五態 / layoutObserver）
  const 語意鍵 = new Set(["toggle", "drawer", "drawerPosition", "五態", "layoutObserver"]);

  for (const va of alpineConfigs) {
    // bind → x-bind:
    if (va.bind) {
      for (const [k, vv] of Object.entries(va.bind as Record<string, string>)) {
        if (語意鍵.has(k)) continue;
        const resolved = 智慧插值(vv, localArgs);
        if (typeof resolved === "string" && !模板正則.test(resolved)) {
          attrs[`x-bind:${k}`] = resolved;
        }
      }
    }
    // attrs → 直接輸出（以 x- 前綴）
    if (va.attrs) {
      for (const [k, vv] of Object.entries(va.attrs as Record<string, string>)) {
        if (語意鍵.has(k)) continue;
        const resolved = 智慧插值(vv, localArgs);
        if (typeof resolved === "string" && !模板正則.test(resolved)) {
          attrs[k.startsWith("x-") ? k : `x-${k}`] = resolved;
        }
      }
    }
    // model
    if (va.model && !語意鍵.has("model")) {
      const resolved = 智慧插值(va.model, localArgs);
      if (typeof resolved === "string" && !模板正則.test(resolved)) {
        attrs["x-model"] = resolved;
      }
    }
    // init（非語意模式產生的手動 init，用安全合併）
    if (va.init && !語意鍵.has("init")) {
      const resolved = 智慧插值(va.init, localArgs);
      if (typeof resolved === "string" && !模板正則.test(resolved)) {
        attrs["x-init"] = 安全合併Init(attrs["x-init"], resolved);
      }
    }
  }

  // ── 4. on 事件映射 → x-on: ──
  if (definition.on) {
    for (const [k, v] of Object.entries(definition.on as Record<string, string>)) {
      attrs[`x-on:${k}`] = 智慧插值(v, localArgs);
    }
  }

  // ── 5. data-* 屬性 ──
  if (definition.data) {
    for (const [k, v] of Object.entries(definition.data as Record<string, string>)) {
      attrs[`data-${k}`] = 智慧插值(v, localArgs);
    }
  }

  return attrs;
}
