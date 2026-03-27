import { info, error } from "../../utils/logger.ts";
import { InnerAPI } from "../index.ts";
import 內建方塊解析器 from "./內建方塊解析器.ts";
import 組合方塊解析器 from "./組合方塊解析器.ts";
import AI方塊解析器 from "./AI方塊解析器.ts";

/**
 * 動態方塊解析器
 * 根據方塊模式動態解析不同類型的方塊
 */
export default class 動態方塊解析器 {
  private static readonly 最大深度 = 10; // 防止無窮迴圈
  
  /**
   * 解析方塊
   */
  static async 解析(方塊ID: string, 內容: any, 深度: number = 0, c?: any): Promise<string> {
    try {
      if (深度 > this.最大深度) {
        throw new Error(`方塊解析深度超過限制: ${深度}`);
      }
      
      await info('動態方塊解析器', `解析方塊: ${方塊ID}, 深度: ${深度}`);
      
      // 1. 取得方塊定義
      const 方塊定義 = await this.取得方塊定義(方塊ID, c);
      
      // 2. 根據模式解析
      switch (方塊定義.模式) {
        case '內建':
          return await 內建方塊解析器.解析(方塊定義, 內容);
        case '組合':
          return await 組合方塊解析器.解析(方塊定義, 內容, 深度);
        case 'AI':
          return await AI方塊解析器.解析(方塊定義, 內容);
        default:
          throw new Error(`未知的方塊模式: ${方塊定義.模式}`);
      }
    } catch (err) {
      await error('動態方塊解析器', `解析失敗: ${err.message}`);
      return `<div class="error">方塊解析失敗: ${err.message}</div>`;
    }
  }
  
  /**
   * 取得方塊定義
   */
  private static async 取得方塊定義(方塊ID: string, c: any): Promise<any> {
    try {
      await info('動態方塊解析器', `取得方塊定義: ${方塊ID}`);
      
      // 使用 InnerAPI 從 cube API 取得方塊定義
      const 方塊回應 = await InnerAPI(c, `/api/v1/cube/${方塊ID}`);
      const 方塊資料 = await 方塊回應.json();
      
      if (方塊資料.success && 方塊資料.data) {
        await info('動態方塊解析器', `成功取得方塊定義: ${方塊ID}`);
        return 方塊資料.data;
      }
      
      // 如果 API 查詢失敗，返回預設方塊定義作為 fallback
      await info('動態方塊解析器', `API 查詢失敗，使用預設定義: ${方塊ID}`);
      return this.取得預設方塊定義(方塊ID);
      
    } catch (err) {
      await error('動態方塊解析器', `取得方塊定義失敗: ${err.message}`);
      // fallback 到預設定義
      return this.取得預設方塊定義(方塊ID);
    }
  }
  
  /**
   * 取得預設方塊定義（fallback 用）
   */
  private static 取得預設方塊定義(方塊ID: string): any {
    const 預設方塊定義: Record<string, any> = {
      '方塊:方塊:容器': {
        id: '方塊:方塊:容器',
        模式: '內建',
        元件路徑: 'container/Container',
        屬性定義: {
          children: { type: 'object', required: true },
          direction: { type: 'string', default: 'column' },
          gap: { type: 'string', default: 'md' },
          padding: { type: 'string', default: 'md' }
        }
      },
      '方塊:方塊:卡片': {
        id: '方塊:方塊:卡片',
        模式: '內建',
        元件路徑: 'ui/Card',
        屬性定義: {
          title: { type: 'string', required: false },
          content: { type: 'string', required: false },
          variant: { type: 'string', default: 'default' },
          padding: { type: 'string', default: 'md' }
        }
      },
      '方塊:方塊:MainMenu': {
        id: '方塊:方塊:MainMenu',
        模式: '內建',
        元件路徑: 'navigation/MainMenu',
        屬性定義: {
          logo: { type: 'string', required: false },
          menuItems: { type: 'array', required: true }
        }
      },
      '方塊:方塊:Footer': {
        id: '方塊:方塊:Footer',
        模式: '內建',
        元件路徑: 'navigation/Footer',
        屬性定義: {
          text: { type: 'string', required: false },
          links: { type: 'array', required: false }
        }
      },
      '方塊:方塊:cube-網站-經典': {
        id: '方塊:方塊:cube-網站-經典',
        模式: '組合',
        子方塊: [
          { 方塊ID: '方塊:方塊:MainMenu', 參數: {} },
          { 方塊ID: '方塊:方塊:容器', 參數: {} },
          { 方塊ID: '方塊:方塊:Footer', 參數: {} }
        ],
        對外參數: {
          mainContent: { 映射到: '子方塊[1].參數.children' }
        }
      }
    };
    
    const 定義 = 預設方塊定義[方塊ID];
    if (!定義) {
      throw new Error(`找不到方塊定義: ${方塊ID}`);
    }
    
    return 定義;
  }
}
