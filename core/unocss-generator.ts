// unocss-generator.ts (2026 完全體 - 零硬編碼、純淨分流核心)
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
    activeCurrent: string[],
    hoverCurrent: string[],
    inactiveCurrent: string[]
  ) {
    // 🎯 核心鐵律：直接把分流後的原始 token 陣列交給 Rules 內部去用內建函數解析
    const { rules, variants } = getSystemRules(activeCurrent, hoverCurrent, inactiveCurrent); 
    const 動態色彩Theme = 提取UnoCSS動態Theme色彩(this.配色);

    return await createGenerator({
      presets: [presetWind3()],
      rules: rules,
      variants: variants,
      shortcuts: [], 
      theme: { colors: 動態色彩Theme }
    });
  }

  // 🔥【已徹底剷除】 舊有的 提取Current樣式屬性 函數與正則拆大括號的硬編碼行為！

  public async 產生樣式(html: string, 啟用快取: boolean = true): Promise<string> {
    const cacheKey = 啟用快取 ? 快取管理器.計算雜湊(html, this.骨架, this.配色, this.風格, this.裝飾) : null;
    if (啟用快取 && cacheKey) {
      const cachedCss = 快取管理器.取得值(cacheKey);
      if (cachedCss) return cachedCss;
    }
    
    // ⚙️ 1. 提取原始配置字串
    const jsonActive = this.風格?.配置?.active || "bg-current text-current-content border border-solid border-current-30 shadow-sm";     
    const jsonInactive = this.風格?.配置?.inactive || "bg-base-50 text-base-50-content border border-solid border-base-50/20 shadow-none"; 
    const jsonHover = this.風格?.配置?.hover || "bg-current-70";
    
    const jsonLayout = (this.骨架 as any)?.配置字串 || "";

    // ⚡ ==================== 核心黃金公式：三態雙軌物理分流 ====================
    const activeCurrent: string[] = [];
    const activeElse: string[] = [];
    jsonActive.split(/\s+/).forEach(cls => {
      if (!cls) return;
      if (cls.includes('current')) activeCurrent.push(cls); // 攔截 active 的 current
      else activeElse.push(cls); // 放行 active 的常規原子類
    });

    const hoverCurrent: string[] = [];
    const hoverElse: string[] = [];
    jsonHover.split(/\s+/).forEach(cls => {
      if (!cls) return;
      if (cls.includes('current')) hoverCurrent.push(cls); // 攔截 hover 的 current
      else hoverElse.push(cls); // 放行 hover 的常規原子類
    });

    const inactiveCurrent: string[] = [];
    const inactiveElse: string[] = [];
    jsonInactive.split(/\s+/).forEach(cls => {
      if (!cls) return;
      if (cls.includes('current')) inactiveCurrent.push(cls); // 攔截 inactive 的 current
      else inactiveElse.push(cls); // 放行 inactive 的常規原子類
    });

    // 🚀 現場直接建立無狀態編譯核心，不再需要先在外部弄一個重複的代理引擎
    const 核心引擎 = await this.確保Uno核心已建立(activeCurrent, hoverCurrent, inactiveCurrent);

    // 處理其餘放行的原子類別（常規 else 項目加上對應前綴包裝）
    const 展開後的Active原生類 = activeElse.join(' ');
    const 展開後的Hover原生類 = hoverElse.map(cls => `hover:${cls}`).join(' ');
    const 展開後的Inactive原生類 = inactiveElse.map(cls => `inactive:${cls}`).join(' ');
    const 展開後的幾何原生類 = jsonLayout; // 幾何佈局保持常規原子類別

    // 🎯 引導 HTML 熔接 (佈局幾何類別完美的排在外部，而 current 類別已被強力過濾攔截，前線絕不產生額外原生 CSS)
    const 風格引導HTML = `<div class="c-style-apply c-div-active ${展開後的幾何原生類} ${展開後的Active原生類} ${展開後的Hover原生類} ${展開後的Inactive原生類}"></div>`;
    const 最終編編HTML = `${html}\n${風格引導HTML}`;

    const { css: unoCss } = await 核心引擎.generate(最終編編HTML, { preflights: false });
    
    const 主題CSS = 生成全域主題CSS(this.骨架, this.配色, this.風格, this.裝飾);
    const 動畫CSS = 生成動畫CSS(this.骨架);
    
    const 最終CSS = `${主題CSS}\n${動畫CSS}\n${unoCss}`.trim();
    if (啟用快取 && cacheKey) { 快取管理器.設定值(cacheKey, 最終CSS); }
    return 最終CSS;
  }

  public 取得所有生成的Classes() { return { 元數據: { classes: [] }, 動畫: { classes: [] }, 自訂規則: { rules: [] } }; }
  public 驗證CSSClass(className: string): boolean { return true; }
}