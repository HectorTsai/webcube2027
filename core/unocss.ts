// unocss.ts (2026 方案甲全域樣式處理中樞 - 預熱咒語對齊完全體)
import { UnoCSS生成器 } from './unocss-generator.ts';
import { 快取管理器 } from './unocss-cache.ts';
import 配色 from "../database/models/配色.ts";
import 骨架 from "../database/models/骨架.ts";
import 風格 from "../database/models/風格.ts";
import 裝飾 from "../database/models/裝飾.ts";

let 系統生成器: UnoCSS生成器 | null = null;

export function 取得系統生成器(): UnoCSS生成器 | null {
  return 系統生成器;
}

/**
 * 初始化 UnoCSS 系統
 */
export async function 初始化UnoCSS(Skeleton?: 骨架, Color?: 配色, Style?: 風格, Ornament?: 裝飾): Promise<void> {
  快取管理器.清理樣式快取();

  系統生成器 = new UnoCSS生成器(
    Skeleton || new 骨架(), 
    Color || new 配色(), 
    Style || new 風格(), 
    Ornament || new 裝飾()
  );
  
  // 預熱：觸發 c-style-apply rule + 三個 c-div-* shortcut 的 CSS 生成
  const 物理對齊預熱HTML = '<div class="c-style-apply c-div-active c-div-hover c-div-inactive"></div>';
  await 系統生成器.產生樣式(物理對齊預熱HTML, false);
}

/**
 * 從 HTML 內容動態生成全站 CSS 樣式
 */
export async function 產生樣式(
  html: string, 
  主題配色?: 配色, 
  啟用快取: boolean = true, 
  骨架配置?: 骨架,
  風格配置?: 風格,
  裝飾配置?: 裝飾
): Promise<string> {
  if (系統生成器 && !主題配色 && !骨架配置 && !風格配置 && !裝飾配置) {
    return await 系統生成器.產生樣式(html, 啟用快取);
  }
  
  const api生成器 = new UnoCSS生成器(
    骨架配置 || new 骨架(), 
    主題配色 || new 配色(), 
    風格配置 || new 風格(),
    裝飾配置 || new 裝飾()
  );
  
  return await api生成器.產生樣式(html, 啟用快取);
}