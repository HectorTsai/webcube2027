import { info, error } from "../../utils/logger.ts";
import { jsx } from "hono/jsx";
import { Context } from "hono";

/**
 * 組合方塊解析器
 * 處理組合模式的方塊，遞迴解析子方塊
 * 現在使用 JSX 版本以支援水合功能
 */
export default class 組合方塊解析器 {
  /**
   * 解析組合方塊
   */
  static async 解析(方塊定義: any, 內容: any, 深度: number = 0, c?: Context): Promise<any> {
    try {
      const 方塊定義Obj = 方塊定義 as any;
      await info('組合方塊解析器', `解析組合方塊: ${方塊定義Obj.id}, 子方塊數量: ${方塊定義Obj.子方塊.length}`);
      
      // 處理對外參數映射
      const 處理後子方塊 = await this.處理參數映射(方塊定義Obj.子方塊, 方塊定義Obj.對外參數, 內容);
      
      // 🆕 動態載入 JSX 版本的解析器
      const 動態方塊JSX解析器 = await import('./動態方塊JSX解析器.ts');
      
      // 遞迴解析每個子方塊（使用 JSX 版本）
      const 子方塊JSX陣列 = await Promise.all(
        處理後子方塊.map(async (子方塊: any) => {
          const 子方塊JSX = await 動態方塊JSX解析器.default.解析(
            子方塊.方塊ID, 
            子方塊.參數, 
            深度 + 1,
            c
          );
          return 子方塊JSX;
        })
      );
      
      // 🆕 返回 JSX 元素而不是 HTML 字符串
      return jsx('div', { 
        class: 'composite-cube', 
        'data-cube-id': 方塊定義Obj.id 
      }, [
        jsx('div', { class: 'composite-info' }, [
          jsx('h3', {}, `組合方塊: ${方塊定義Obj.id}`),
          jsx('div', { class: 'sub-cubes' }, 子方塊JSX陣列)
        ])
      ]);
    } catch (err) {
      const errorMsg = err as Error;
      await error('組合方塊解析器', `組合方塊解析失敗: ${errorMsg.message}`);
      return jsx('div', { class: 'error' }, `組合方塊解析失敗: ${errorMsg.message}`);
    }
  }
  
  /**
   * 處理參數映射
   */
  private static async 處理參數映射(子方塊: any[], 對外參數: any, 外部內容: any): Promise<any[]> {
    try {
      // TODO: 實作真正的參數映射邏輯
      // 目前直接返回子方塊，不處理映射
      return 子方塊.map(子 => ({
        ...子,
        參數: { ...子.參數, ...外部內容 }
      }));
    } catch (err) {
      await error('組合方塊解析器', `參數映射失敗: ${err.message}`);
      return 子方塊;
    }
  }
}
