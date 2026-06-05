// unocss-rules.ts (2026 完全體 - 內建函數對譯、解決 c-div-active 缺失防線)
import { Rule, Variant } from '@unocss/core';

export function getSystemRules(
  activeCurrent: string[] = [],
  hoverCurrent: string[] = [],
  inactiveCurrent: string[] = []
): { rules: Rule<any>[], variants: Variant<any>[] } {
  const rules: Rule<any>[] = [
    // 📐 1. c-style-apply 專職處理您指定的過渡效果與核心強制變色
    [
      /^c-style-apply$/,
      () => {
        return `
.c-style-apply {
  background-color: currentColor !important;
  transition: background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out;
}
`.trim();
      }
    ],

    // ⚡ 2. c-div-active 規則：透過解構直接拿官方 generator 引擎，進行 100% 零硬編碼動態對譯！
    [
      /^c-div-active$/,
      async (_, { generator }) => {
        let finalDynamicCss = '';

        // 萬能轉譯與重寫輔助函數 (完全無 if/else)
        const 轉換並重寫選擇器 = async (tokens: string[], 目標選擇器: string) => {
          if (tokens.length === 0) return '';
          
          // 🚀 100% 使用 UnoCSS 內建函數將傳入的 current 類別字串編譯為標準原子 CSS
          const { css } = await generator.generate(tokens.join(' '), { preflights: false, minify: true });
          
          // 🎯 利用正則精準將 UnoCSS 生成的原子選擇器（如 .bg-current, .text-current-content）批次替換成我們的目標選擇器
          let rewrittenCss = css.replace(/\.[^\s{,]+(?=[{,])/g, 目標選擇器);
          
          // ⚡ 自動在每條屬性宣告後方強灌 !important 確保最高權重，不帶任何屬性對照表
          rewrittenCss = rewrittenCss.replace(/([^;{}]+)(;|\s*})/g, (match, propVal, end) => {
            const trimmed = propVal.trim();
            if (!trimmed || trimmed.includes('!important') || trimmed.startsWith('/*')) return match;
            return `${trimmed} !important${end}`;
          });
          
          return rewrittenCss + '\n';
        };

        // 🟢 三態流道自動對譯注入 -> 讓它們全部依附在 .c-div-active 選擇器族群下
        
        // Active 態 -> 生成 .c-div-active
        finalDynamicCss += await 轉換並重寫選擇器(activeCurrent, '.c-div-active');
        
        // Hover 態 -> 清除前綴並生成 .c-div-active:hover
        const cleanHover = hoverCurrent.map(cls => cls.replace(/^hover:/, ''));
        finalDynamicCss += await 轉換並重寫選擇器(cleanHover, '.c-div-active:hover');
        
        // Inactive 態 -> 清除前綴並生成 .c-div-active[data-active="false"]
        const cleanInactive = inactiveCurrent.map(cls => cls.replace(/^inactive:/, ''));
        finalDynamicCss += await 轉換並重寫選擇器(cleanInactive, '.c-div-active[data-active="false"]');

        return finalDynamicCss.trim();
      }
    ]
  ];

  // 🛡️ 變體隔離防線
  const variants: Variant<any>[] = [
    (matcher) => {
      if (!matcher.startsWith('inactive:')) return matcher;
      return {
        matcher: matcher.slice(9),
        selector: (s) => `${s}[data-active="false"]`
      };
    }
  ];

  return { rules, variants };
}