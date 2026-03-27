import 頁面 from "../../database/models/頁面.ts";
import 方塊 from "../../database/models/方塊.ts";
import { info, error } from "../../utils/logger.ts";
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 動態方塊解析器 from "./動態方塊解析器.ts";
import { InnerAPI } from "../index.ts";
import { Context } from "hono";
import languageService from "../languageService/index.ts";

/**
 * 頁面渲染服務
 * 負責將頁面模型轉換為可渲染的 HTML
 */
export default class PageService {
  /**
   * 解析 URL 路徑，提取語言和頁面路徑
   */
  static async 解析URL路徑(path: string, c: Context): Promise<{ 語言: string; 頁面路徑: string } | null> {
    try {
      await info('PageService', `解析URL路徑: ${path}`);
      
      // 1. 取得支援的語言列表
      const 支援語言 = await languageService.取得支援語言(c);
      
      // 2. 檢查是否是語言前綴格式
      const match = path.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)?$/);
      if (match) {
        const [, 語言前綴, 頁面路徑部分] = match;
        const 頁面路徑 = 頁面路徑部分 || '/'; // /en → /
        
        // 3. 驗證語言是否支援
        const isSupported = await languageService.檢查語言支援(c, 語言前綴);
        if (isSupported) {
          await info('PageService', `語言前綴解析成功: ${語言前綴} → ${頁面路徑}`);
          return { 語言: 語言前綴, 頁面路徑 };
        } else {
          await info('PageService', `語言不支援: ${語言前綴}`);
          return null; // 404 - 語言不支援
        }
      }
      
      // 4. 沒有語言前綴，使用預設語言
      const 預設語言 = 支援語言.length > 0 ? 支援語言[0] : 'zh-tw';
      await info('PageService', `使用預設語言: ${預設語言} → ${path}`);
      return { 語言: 預設語言, 頁面路徑: path };
      
    } catch (err) {
      await error('PageService', `URL路徑解析失敗: ${err.message}`);
      return null;
    }
  }

  /**
   * 渲染頁面為 HTML
   */
  static async renderPage(頁面實例: 頁面, 路由參數: Record<string, string> = {}, c?: Context): Promise<string> {
    try {
      await info('PageService', `開始渲染頁面: ${頁面實例.路徑}`);
      
      // 1. 處理路徑參數替換
      const 處理後內容 = this.處理路徑參數(頁面實例.內容, 路由參數);
      
      // 2. 取得當前骨架的佈局設定
      const 佈局方塊ID = await this.取得佈局方塊ID(c);
      
      // 3. 建構佈局內容，將頁面內容注入
      const 佈局內容 = await this.建構佈局內容(佈局方塊ID, 頁面實例.方塊, 處理後內容);
      
      // 4. 使用動態解析器渲染佈局方塊
      const html = await 動態方塊解析器.解析(佈局方塊ID, 佈局內容, 0, c);
      
      await info('PageService', `頁面渲染完成: ${頁面實例.路徑}`);
      return html;
    } catch (err) {
      await error('PageService', `頁面渲染失敗: ${err.message}`);
      return this.渲染錯誤頁面(err);
    }
  }

  /**
   * 取得當前骨架的佈局方塊ID
   */
  private static async 取得佈局方塊ID(c: Context): Promise<string> {
    try {
      await info('PageService', '取得佈局方塊ID');
      
      // 使用 innerAPI 取得當前主題的骨架設定
      const app = c.get('app');
      const 骨架回應 = await app.request('/api/v1/defaults/skeleton', {
        headers: { 'host': c.req.header('host') || 'localhost:8000' }
      });
      
      const 骨架資料 = await 骨架回應.json();
      
      if (骨架資料.success && 骨架資料.data?.佈局) {
        await info('PageService', `取得佈局方塊ID: ${骨架資料.data.佈局}`);
        return 骨架資料.data.佈局;
      }
      
      // fallback 到預設值
      await info('PageService', '使用預設佈局方塊ID');
      return '方塊:方塊:cube-網站-經典';
    } catch (err) {
      await error('PageService', `取得佈局方塊ID失敗: ${err.message}`);
      return '方塊:方塊:容器'; // fallback
    }
  }

  /**
   * 建構佈局內容，將頁面內容注入到佈局中
   */
  private static async 建構佈局內容(佈局方塊ID: string, 頁面方塊ID: string, 頁面內容: any): Promise<any> {
    try {
      await info('PageService', `建構佈局內容: ${佈局方塊ID} + ${頁面方塊ID}`);
      
      // TODO: 從 API 取得佈局方塊的結構定義
      // 目前返回預設的經典佈局結構
      return {
        direction: 'column',
        gap: 'none',
        children: [
          {
            方塊: '方塊:方塊:MainMenu',
            內容: {
              logo: 'WebCube 2027',
              menuItems: [
                { label: '首頁', href: '/' },
                { label: '關於我們', href: '/about' },
                { label: '聯絡我們', href: '/contact' }
              ]
            }
          },
          {
            方塊: 頁面方塊ID,  // 注入頁面方塊
            內容: 頁面內容   // 注入頁面內容
          },
          {
            方塊: '方塊:方塊:Footer',
            內容: {
              text: '© 2026 WebCube 2027. All rights reserved.',
              links: [
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' }
              ]
            }
          }
        ]
      };
    } catch (err) {
      await error('PageService', `建構佈局內容失敗: ${err.message}`);
      return {
        children: [
          {
            方塊: 頁面方塊ID,
            內容: 頁面內容
          }
        ]
      };
    }
  }

  /**
   * 處理路徑參數替換
   */
  private static 處理路徑參數(內容: any, 參數: Record<string, string>): any {
    if (!內容 || typeof 內容 !== 'object') return 內容;
    
    const 處理後內容 = JSON.parse(JSON.stringify(內容));
    
    // 遞迴處理所有字串，替換 {參數名} 格式
    const 處理物件 = (obj: any): any => {
      if (typeof obj === 'string') {
        let result = obj;
        for (const [key, value] of Object.entries(參數)) {
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        return result;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(處理物件);
      }
      
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = 處理物件(value);
        }
        return result;
      }
      
      return obj;
    };
    
    return 處理物件(處理後內容);
  }

  /**
   * 渲染錯誤頁面
   */
  private static 渲染錯誤頁面(err: Error): string {
    return `
      <div class="error-page">
        <h1>頁面渲染錯誤</h1>
        <p>${err.message}</p>
        <pre>${err.stack}</pre>
      </div>
    `;
  }

  /**
   * 根據路徑查找頁面（支援多語言路由）
   */
  static async findPageByPath(path: string, c: Context): Promise<頁面 | null> {
    try {
      await info('PageService', `查找頁面: ${path}`);
      
      // 1. 解析 URL 路徑，取得語言和頁面路徑
      const 解析結果 = await this.解析URL路徑(path, c);
      await info('PageService', `解析結果: ${JSON.stringify(解析結果)}`);
      
      if (!解析結果) {
        await info('PageService', `URL路徑解析失敗: ${path}`);
        return null; // 404 - 語言不支援
      }
      
      const { 語言, 頁面路徑 } = 解析結果;
      await info('PageService', `解析成功 - 語言: ${語言}, 頁面路徑: ${頁面路徑}`);
      
      // 2. 使用 InnerAPI 從 pages API 查找頁面
      const 頁面回應 = await InnerAPI(c, '/api/v1/pages/path');
      
      // 手動處理 POST 請求
      const app = c.get('app');
      const 頁面回應2 = await app.request('/api/v1/pages/path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'host': c.req.header('host') || 'localhost:8000',
          'origin': c.req.header('origin') || 'http://localhost:8000'
        },
        body: JSON.stringify({ path: 頁面路徑 })
      });
      
      const 頁面資料 = await 頁面回應2.json();
      await info('PageService', `API回應: ${JSON.stringify(頁面資料)}`);
      
      if (頁面資料.success && 頁面資料.data) {
        await info('PageService', `成功取得頁面: ${頁面路徑}`);
        
        // 將 API 資料轉換為 頁面 實例
        const 頁面實例 = new 頁面(頁面資料.data, false);
        await info('PageService', `頁面實例建立: ${頁面實例.路徑}`);
        return 頁面實例;
      }
      
      await info('PageService', `找不到頁面: ${頁面路徑}`);
      return null;
      
    } catch (err) {
      await error('PageService', `查找頁面失敗: ${err.message}`);
      return null;
    }
  }

  /**
   * 解析動態路由參數
   */
  static parseRouteParams(path: string, pattern: string): Record<string, string> {
    const 參數: Record<string, string> = {};
    
    if (!pattern || !pattern.includes('{')) {
      return 參數;
    }
    
    // 簡單的路由參數解析
    // 例如: path="/users/john", pattern="/users/{username}"
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith('{') && patternPart.endsWith('}')) {
        const paramName = patternPart.slice(1, -1);
        if (pathParts[i]) {
          參數[paramName] = pathParts[i];
        }
      }
    }
    
    return 參數;
  }
}
