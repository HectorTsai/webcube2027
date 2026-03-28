import { info, error } from "../../utils/logger.ts";
import { resolve } from "https://deno.land/std@0.207.0/path/mod.ts";

/**
 * 內建方塊解析器
 * 處理內建模式的方塊，動態載入元件並渲染
 * 元件自己負責處理資料格式，解析器不做任何資料轉換
 */
export default class 內建方塊解析器 {
  /**
   * 解析內建方塊
   */
  static async 解析(方塊定義: any, 內容: any): Promise<string> {
    try {
      await info('內建方塊解析器', `解析內建方塊: ${方塊定義.元件路徑}`);
      
      // 動態 import 元件
      const 元件路徑 = resolve('.', 'components', ...方塊定義.元件路徑.split('/')) + '.tsx';
      const 元件模組 = await import(元件路徑);
      const 元件 = 元件模組.default;
      
      if (!元件) {
        throw new Error(`找不到元件的 default export: ${方塊定義.元件路徑}`);
      }
      
      if (typeof 元件 !== 'function') {
        throw new Error(`元件不是函數: ${方塊定義.元件路徑} (${typeof 元件})`);
      }
      
      // 呼叫元件，直接傳遞內容，讓元件自己處理資料格式
      const jsxNode = 元件(內容);
      
      // HonoJSX 的 JSXNode.toString() 直接返回 HTML 字串
      const html = jsxNode.toString();
      
      await info('內建方塊解析器', `元件渲染成功: ${方塊定義.元件路徑} (${html.length} 字元)`);
      return html;
    } catch (err) {
      await error('內建方塊解析器', `內建方塊解析失敗: ${(err as Error).message}`);
      return `<div class="error" data-cube="${方塊定義?.id || 'unknown'}">內建方塊解析失敗: ${(err as Error).message}</div>`;
    }
  }
}
