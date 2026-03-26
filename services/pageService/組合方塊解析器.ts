import { info, error } from "../../utils/logger.ts";
import 動態方塊解析器 from "./動態方塊解析器.ts";

/**
 * 組合方塊解析器
 * 處理組合模式的方塊，遞迴解析子方塊
 */
export default class 組合方塊解析器 {
  /**
   * 解析組合方塊
   */
  static async 解析(方塊定義: any, 內容: any, 深度: number = 0, c?: any): Promise<string> {
    try {
      await info('組合方塊解析器', `解析組合方塊: ${方塊定義.id}, 子方塊數量: ${方塊定義.子方塊.length}`);
      
      // 處理對外參數映射
      const 處理後子方塊 = await this.處理參數映射(方塊定義.子方塊, 方塊定義.對外參數, 內容);
      
      // 遞迴解析每個子方塊
      const 子方塊HTML陣列 = await Promise.all(
        處理後子方塊.map(async (子方塊: any) => {
          const 子方塊HTML = await 動態方塊解析器.解析(
            子方塊.方塊ID, 
            子方塊.參數, 
            深度 + 1,
            c
          );
          return 子方塊HTML;
        })
      );
      
      // 組合所有子方塊的 HTML
      return `
        <div class="composite-cube" data-cube-id="${方塊定義.id}">
          <div class="composite-info">
            <h3>組合方塊: ${方塊定義.id}</h3>
            <div class="sub-cubes">
              ${子方塊HTML陣列.join('\n')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      await error('組合方塊解析器', `組合方塊解析失敗: ${err.message}`);
      return `<div class="error">組合方塊解析失敗: ${err.message}</div>`;
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
