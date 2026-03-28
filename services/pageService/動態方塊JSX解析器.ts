import { info, error } from "../../utils/logger.ts";
import { resolve } from "https://deno.land/std@0.207.0/path/mod.ts";
import { jsx } from "hono/jsx";

/**
 * 動態方塊JSX解析器
 * 專門返回 JSX 元件，而不是 HTML 字串
 */
export default class 動態方塊JSX解析器 {
  private static readonly 最大深度 = 10;

  /**
   * 解析方塊為 JSX 元件
   */
  static async 解析(方塊ID: string, 內容: any, 深度: number = 0, c?: any): Promise<any> {
    try {
      if (深度 > this.最大深度) {
        throw new Error(`方塊解析深度超過限制: ${深度}`);
      }

      await info('動態方塊JSX解析器', `解析方塊: ${方塊ID}, 深度: ${深度}`);

      // 1. 取得方塊定義
      const 方塊定義 = await this.取得方塊定義(方塊ID, c);

      // 2. 根據模式解析
      switch (方塊定義.模式) {
        case '內建':
          return await this.解析內建方塊(方塊定義, 內容);
        case '組合':
          return await this.解析組合方塊(方塊定義, 內容, 深度, c);
        case 'AI':
          return await this.解析AI方塊(方塊定義, 內容);
        default:
          throw new Error(`未知的方塊模式: ${方塊定義.模式}`);
      }
    } catch (err) {
      await error('動態方塊JSX解析器', `解析失敗: ${err.message}`);
      return jsx('div', { className: 'error' }, `方塊解析失敗: ${err.message}`);
    }
  }

  /**
   * 取得方塊定義
   */
  private static async 取得方塊定義(方塊ID: string, c: any): Promise<any> {
    try {
      await info('動態方塊JSX解析器', `取得方塊定義: ${方塊ID}`);

      // 使用 InnerAPI 從 cube API 取得方塊定義
      const { InnerAPI } = await import("../index.ts");
      const 方塊回應 = await InnerAPI(c, `/api/v1/cube/${方塊ID}`);
      const 方塊資料 = await 方塊回應.json();

      if (方塊資料.success && 方塊資料.data) {
        await info('動態方塊JSX解析器', `成功取得方塊定義: ${方塊ID}`);
        return 方塊資料.data;
      }

      throw new Error(`找不到方塊定義: ${方塊ID}`);
    } catch (err) {
      await error('動態方塊JSX解析器', `取得方塊定義失敗: ${err.message}`);
      throw err;
    }
  }

  /**
   * 解析內建方塊
   */
  private static async 解析內建方塊(方塊定義: any, 內容: any): Promise<any> {
    try {
      await info('動態方塊JSX解析器', `解析內建方塊: ${方塊定義.元件路徑}`);

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

      // 呼叫元件，返回 JSX 元件
      const jsxElement = 元件(內容);

      await info('動態方塊JSX解析器', `元件渲染成功: ${方塊定義.元件路徑}`);
      return jsxElement;
    } catch (err) {
      await error('動態方塊JSX解析器', `內建方塊解析失敗: ${(err as Error).message}`);
      return jsx('div', { className: 'error' }, `內建方塊解析失敗: ${(err as Error).message}`);
    }
  }

  /**
   * 解析組合方塊
   */
  private static async 解析組合方塊(方塊定義: any, 內容: any, 深度: number, c: any): Promise<any> {
    try {
      await info('動態方塊JSX解析器', `解析組合方塊: ${方塊定義.id}, 子方塊數量: ${方塊定義.子方塊.length}`);

      // 處理對外參數映射
      const 處理後子方塊 = await this.處理參數映射(方塊定義.子方塊, 方塊定義.對外參數, 內容);

      // 遞迴解析每個子方塊
      const 子方塊JSX陣列 = await Promise.all(
        處理後子方塊.map(async (子方塊: any) => {
          const 子方塊JSX = await this.解析(
            子方塊.方塊ID,
            子方塊.參數,
            深度 + 1,
            c
          );
          return jsx('div', { key: 子方塊.方塊ID }, 子方塊JSX);
        })
      );

      return jsx('div', {}, 子方塊JSX陣列);
    } catch (err) {
      await error('動態方塊JSX解析器', `組合方塊解析失敗: ${(err as Error).message}`);
      return jsx('div', { className: 'error' }, `組合方塊解析失敗: ${(err as Error).message}`);
    }
  }

  /**
   * 解析AI方塊
   */
  private static async 解析AI方塊(方塊定義: any, 內容: any): Promise<any> {
    try {
      await info('動態方塊JSX解析器', `解析AI方塊: ${方塊定義.id}`);
      
      // TODO: 實作 AI 方塊解析邏輯
      return jsx('div', { className: 'ai-block' }, `AI方塊: ${方塊定義.id}`);
    } catch (err) {
      await error('動態方塊JSX解析器', `AI方塊解析失敗: ${(err as Error).message}`);
      return jsx('div', { className: 'error' }, `AI方塊解析失敗: ${(err as Error).message}`);
    }
  }

  /**
   * 處理參數映射
   */
  private static async 處理參數映射(子方塊: any[], 對外參數: any, 內容: any): Promise<any[]> {
    // TODO: 實作參數映射邏輯
    return 子方塊;
  }
}
