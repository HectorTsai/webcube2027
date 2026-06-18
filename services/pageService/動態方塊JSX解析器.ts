import { info, error } from "../../utils/logger.ts";
import { jsx } from "hono/jsx";
import { Context } from "hono";
import Cube from "../../components/方塊.tsx";
import { 安全過濾 } from "../../utils/安全過濾器.ts";

/**
 * 動態方塊JSX解析器 (2026 新版 — 對接統一 Cube 系統)
 * 將頁面 JSON 內容轉換為 JSX 元件樹。
 * 所有方塊統一走 <Cube from="方塊ID" args={內容} />，由 方塊.tsx 統一處理。
 */
export default class 動態方塊JSX解析器 {
  private static readonly 最大深度 = 10;

  /**
   * 解析方塊 — 遞迴將 { 方塊, 內容 } 結構轉為 JSX
   */
  static async 解析(方塊ID: string, 內容: any, c: Context, 深度: number = 0): Promise<any> {
    try {
      if (深度 > this.最大深度) {
        throw new Error(`方塊解析深度超過限制: ${深度}`);
      }

      const 內容拷貝 = JSON.parse(JSON.stringify(內容));
      內容拷貝.context = c;

      // 遞迴處理 children
      if (內容拷貝.children && Array.isArray(內容拷貝.children)) {
        內容拷貝.children = await this.解析Children(內容拷貝.children, 深度, c);
      }

      // 統一走 Cube 元件，由方塊.tsx 處理 from / args / wrap / 安全過濾
      const jsxElement = jsx(Cube as any, {
        from: 方塊ID,
        args: 內容拷貝,
        depth: 深度,
        context: c,
      } as any);

      await info('動態方塊JSX解析器', `方塊渲染完成: ${方塊ID}, 深度: ${深度}`);
      return jsxElement;
    } catch (err) {
      await error('動態方塊JSX解析器', `解析失敗: ${(err as Error).message}`);
      return jsx('div', { className: 'error' }, `方塊解析失敗: ${(err as Error).message}`);
    }
  }

  /**
   * 遞迴解析 children 陣列
   */
  private static async 解析Children(children: any[], 深度: number, context: Context): Promise<any[]> {
    const 解析後: any[] = [];

    for (const child of children) {
      if (child.方塊) {
        // 子方塊：遞迴解析
        const 子方塊JSX = await this.解析(child.方塊, child.內容 || {}, context, 深度 + 1);
        解析後.push(子方塊JSX);
      } else if (child.type) {
        // 原生 HTML 元素：安全過濾所有 string 屬性
        const 安全屬性: Record<string, unknown> = {};
        if (child.attributes) {
          for (const [k, v] of Object.entries(child.attributes as Record<string, unknown>)) {
            安全屬性[k] = typeof v === "string" ? 安全過濾(v) : v;
          }
        }
        const 子層 = child.children;
        const 子層JSX = 子層 ? await this.解析Children(子層, 深度, context) : [];
        const 子層內容 = 子層JSX.length > 0 ? 子層JSX : undefined;
        解析後.push(jsx(child.type, { ...安全屬性, children: 子層內容 }));
      } else if (typeof child === "string") {
        解析後.push(安全過濾(child));
      } else {
        解析後.push(child);
      }
    }

    return 解析後;
  }
}
