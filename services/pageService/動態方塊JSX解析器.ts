import { info, error } from "../../utils/logger.ts";
import { jsx } from "hono/jsx";
import { ParameterMapper } from "../../utils/parameter-mapper.ts";
import { Context } from "hono";
import createVariantComponent from "../../components/index.ts";

/**
 * 動態方塊JSX解析器
 * 專門返回 JSX 元件，而不是 HTML 字串
 */
export default class 動態方塊JSX解析器 {
  private static readonly 最大深度 = 10;

  /**
   * 解析方塊 - 主要入口點
   */
  static async 解析(方塊ID: string, 內容: any, c: Context, 深度: number = 0): Promise<any> {
    try {
      if (深度 > this.最大深度) {
        throw new Error(`方塊解析深度超過限制: ${深度}`);
      }

      // 1. 取得方塊定義
      const 方塊定義 = await this.取得方塊定義(方塊ID, c);

      // 2. 根據模式解析 (將當前深度傳遞下去)
      switch (方塊定義.模式) {
        case '內建':
          return await this.解析內建方塊(方塊定義, 內容, 深度, c);
        case '組合':
          return await this.解析組合方塊(方塊定義, 內容, 深度, c);
        case 'AI':
          return await this.解析AI方塊(方塊定義, 內容, 深度, c);
        default:
          throw new Error(`未知的方塊模式: ${方塊定義.模式}`);
      }
    } catch (err: any) {
      await error('動態方塊JSX解析器', `解析失敗: ${err.message}`);
      return jsx('div', { className: 'error' }, `方塊解析失敗: ${err.message}`);
    }
  }

  /**
   * 取得方塊定義
   */
  private static async 取得方塊定義(方塊ID: string, c: Context): Promise<any> {
    try {
      const { InnerAPI } = await import("../index.ts");
      const 方塊回應 = await InnerAPI(c, `/api/v1/cube/${方塊ID}`);
      const 方塊資料 = await 方塊回應.json();

      if (方塊資料.success && 方塊資料.data) {
        return 方塊資料.data;
      }

      throw new Error(`找不到方塊定義: ${方塊ID}`);
    } catch (err: any) {
      await error('動態方塊JSX解析器', `取得方塊定義失敗: ${err.message}`);
      throw err;
    }
  }

  /**
   * 解析內建方塊
   */
  private static async 解析內建方塊(方塊定義: any, 內容: any, 深度: number, c: Context): Promise<any> {
    try {
      內容.context = c;

      // 處理 children（如果有子方塊配置）
      if (內容.children && Array.isArray(內容.children)) {
        內容.children = await this.解析Children(內容.children, 深度, c);
      }

      // 使用 createVariantComponent 動態載入元件
      const createComponent = createVariantComponent(方塊定義.元件路徑);
      const jsxElement = await createComponent(內容);

      await info('動態方塊JSX解析器', `內建方塊渲染完成: ${方塊定義.元件路徑}`);
      return jsxElement;
    } catch (err) {
      await error('動態方塊JSX解析器', `內建方塊解析失敗: ${(err as Error).message}`);
      return jsx('div', { className: 'error' }, `內建方塊解析失敗: ${(err as Error).message}`);
    }
  }

  /**
   * 解析 children 陣列
   */
  private static async 解析Children(children: any[], 深度: number, context: Context): Promise<any[]> {
    const 解析後的Children: any[] = [];

    for (const child of children) {
      if (child.方塊ID) {
        // 遞迴解析時深度 + 1
        const 子方塊JSX = await this.解析(child.方塊ID, child.參數, context, 深度 + 1);
        解析後的Children.push(子方塊JSX);
      } else if (child.type) {
        // 這是一個原生 HTML 元素
        const { type, attributes, children: 子層 } = child;
        const 子層JSX = 子層 ? await this.解析Children(子層, 深度, context) : [];
        const 子層內容 = 子層JSX.length > 0 ? 子層JSX : undefined;
        解析後的Children.push(jsx(type, { ...attributes, children: 子層內容 }));
      } else {
        // 直接是字串或其他值
        解析後的Children.push(child);
      }
    }

    return 解析後的Children;
  }

  /**
   * 解析組合方塊
   */
  private static async 解析組合方塊(方塊定義: any, 內容: any, 深度: number, c: Context): Promise<any> {
    try {
      await info('動態方塊JSX解析器', `解析組合方塊: ${方塊定義.id}, 子方塊數量: ${方塊定義.子方塊.length}`);

      // 使用 ParameterMapper 處理參數映射
      const { result: 處理後子方塊, errors: 映射錯誤 } = ParameterMapper.mapParameters(
        方塊定義.子方塊,
        方塊定義.對外參數,
        內容
      );

      if (映射錯誤.length > 0) {
        await error('動態方塊JSX解析器', `參數映射警告: ${JSON.stringify(映射錯誤)}`);
      }

      // 遞迴解析每個子方塊 (正確遞增深度)
      const 子方塊JSX陣列 = await Promise.all(
        處理後子方塊.map(async (子方塊: any) => {
          const 子方塊JSX = await this.解析(子方塊.方塊ID, 子方塊.參數, c, 深度 + 1);
          return jsx('div', { key: 子方塊.方塊ID }, 子方塊JSX);
        })
      );

      return jsx('div', {}, 子方塊JSX陣列 as any);
    } catch (err) {
      await error('動態方塊JSX解析器', `組合方塊解析失敗: ${(err as Error).message}`);
      return jsx('div', { className: 'error' }, `組合方塊解析失敗: ${(err as Error).message}`);
    }
  }

  /**
   * 解析AI方塊
   */
  private static async 解析AI方塊(方塊定義: any, 內容: any, 深度: number, c: Context): Promise<any> {
    try {
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
    const { result } = ParameterMapper.mapParameters(子方塊, 對外參數, 內容);
    return result;
  }
}