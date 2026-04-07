import { UnoCSS生成器 } from './unocss-generator.ts';
import 配色 from "../database/models/配色.ts";
import 骨架 from "../database/models/骨架.ts";

// UnoCSS 生成器實例 (系統級別)
let 系統生成器: UnoCSS生成器 | null = null;

// 取得系統生成器實例
export function 取得系統生成器(): UnoCSS生成器 | null {
  return 系統生成器;
}

// 初始化 UnoCSS 系統 (系統啟動時調用)
export async function 初始化UnoCSS(Skeleton?: 骨架, Color?: 配色): Promise<void> {
  系統生成器 = new UnoCSS生成器(Skeleton || new 骨架(), Color || new 配色());
  // 預熱生成器內部組件
  await 系統生成器.產生樣式('<div class="test"></div>', false);
}

// 從 HTML 內容生成 CSS (增強版)
export async function 產生樣式(html: string, 主題配色?: 配色, 啟用快取: boolean = true, 骨架配置?: 骨架): Promise<string> {
  // 如果有系統生成器且參數匹配，使用系統生成器
  if (系統生成器 && !主題配色 && !骨架配置) {
    return await 系統生成器.產生樣式(html, 啟用快取);
  }
  
  // 建立新的生成器實例
  const api生成器 = new UnoCSS生成器(骨架配置 || new 骨架(), 主題配色 || new 配色());
  
  // 使用生成器產生樣式
  return await api生成器.產生樣式(html, 啟用快取);
}
