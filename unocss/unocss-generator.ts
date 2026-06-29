// unocss-generator.ts (2026 完全體 — current ⇄ else 雙軌 rule 分工)
import 配色 from "../database/models/配色.ts";
import 骨架 from "../database/models/骨架.ts";
import 風格 from "../database/models/風格.ts";
import 裝飾 from "../database/models/裝飾.ts";
import { 快取管理器 } from './unocss-cache.ts';
import { 生成動畫CSS } from './animate.ts';
import { createGenerator } from '@unocss/core';
import { presetWind3 } from '@unocss/preset-wind3';
import { 生成全域主題CSS, 提取UnoCSS動態Theme色彩 } from './unocss-theme.ts';
import { getSystemRules } from './unocss-rules.ts';

export class UnoCSS生成器 {
  private 骨架: 骨架;
  private 配色: 配色;
  private 風格: 風格;
  private 裝飾: 裝飾;
  
  constructor(骨架: 骨架, 配色: 配色, 風格?: 風格, 裝飾?: 裝飾) {
    this.骨架 = 骨架;
    this.配色 = 配色;
    this.風格 = 風格 || new 風格();
    this.裝飾 = 裝飾 || new 裝飾();
  }
  
  private async 確保Uno核心已建立(
    activeCurrent: string[], hoverCurrent: string[], inactiveCurrent: string[],
    activeElse: string[], hoverElse: string[], inactiveElse: string[],
  ) {
    const rules = getSystemRules(
      activeCurrent, hoverCurrent, inactiveCurrent,
      activeElse, hoverElse, inactiveElse,
    );
    const 動態色彩Theme = 提取UnoCSS動態Theme色彩(this.配色);

    return await createGenerator({
      presets: [presetWind3()],
      rules,
      theme: { colors: 動態色彩Theme }
    });
  }

  public async 產生樣式(html: string, 啟用快取: boolean = true): Promise<string> {
    const cacheKey = 啟用快取 ? 快取管理器.計算雜湊(html, this.骨架, this.配色, this.風格, this.裝飾) : null;
    if (啟用快取 && cacheKey) {
      const cachedCss = 快取管理器.取得值(cacheKey);
      if (cachedCss) return cachedCss;
    }
    
    const jsonActive = this.風格?.配置?.active || "bg-current text-current-content border border-solid border-current-30 shadow-sm";     
    const jsonInactive = this.風格?.配置?.inactive || "bg-base-50 text-base-content border border-solid border-base-50/20 shadow-none"; 
    const jsonHover = this.風格?.配置?.hover || "bg-current-70";
    const jsonLayout = (this.骨架 as any)?.配置字串 || "";

    // ==================== current ⇄ else 雙軌分流 ====================
    const activeCurrent: string[] = [],  activeElse: string[] = [];
    jsonActive.split(/\s+/).forEach(cls => { if (!cls) return; cls.includes('current') ? activeCurrent.push(cls) : activeElse.push(cls); });

    const hoverCurrent: string[] = [],   hoverElse: string[] = [];
    jsonHover.split(/\s+/).forEach(cls  => { if (!cls) return; cls.includes('current') ? hoverCurrent.push(cls)   : hoverElse.push(cls); });

    const inactiveCurrent: string[] = [], inactiveElse: string[] = [];
    jsonInactive.split(/\s+/).forEach(cls => { if (!cls) return; cls.includes('current') ? inactiveCurrent.push(cls) : inactiveElse.push(cls); });

    const 核心引擎 = await this.確保Uno核心已建立(
      activeCurrent, hoverCurrent, inactiveCurrent,
      activeElse, hoverElse, inactiveElse,
    );

    // 🎯 引導 HTML：四個 class 觸發四條 rule
    //    c-style-apply  → current token → CSS variable
    //    c-div-active   → active  else → [data-active="true"]
    //    c-div-hover    → hover   else → [data-active="true"][data-hover="true"]:hover
    //    c-div-inactive → inactive else → [data-active="false"]
    const 風格引導HTML = `<div class="c-style-apply c-div-active c-div-hover c-div-inactive ${jsonLayout}"></div>`;
    const 最終編編HTML = `${html}\n${風格引導HTML}`;

    const { css: unoCss } = await 核心引擎.generate(最終編編HTML, { preflights: false });
    
    const 主題CSS = 生成全域主題CSS(this.骨架, this.配色, this.風格, this.裝飾);
    const 動畫CSS = 生成動畫CSS(this.骨架);

    // 🌿 斑馬紋 CSS（來自精簡後的 wrapChild 引擎，由 cube-zebra-item 標記類觸發）
    const 斑馬紋CSS = `.cube-zebra-item:nth-child(even) {\n  background-color: oklch(0.98 0.01 260 / 0.6);\n}\n.dark .cube-zebra-item:nth-child(even) {\n  background-color: oklch(0.2 0.01 260 / 0.4);\n}`;

    const 最終CSS = `${主題CSS}\n${動畫CSS}\n${斑馬紋CSS}\n${unoCss}`.trim();
    if (啟用快取 && cacheKey) { 快取管理器.設定值(cacheKey, 最終CSS); }
    return 最終CSS;
  }

  public 取得所有生成的Classes() { return { 元數據: { classes: [] }, 動畫: { classes: [] }, 自訂規則: { rules: [] } }; }
  public 驗證CSSClass(className: string): boolean { return true; }
}
