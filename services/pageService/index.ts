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
      
      // 2. 將 JSON 內容轉換為 MultilingualString 物件
      const MultilingualString內容 = await this.轉換JSON為MultilingualString(處理後內容);
      
      // 檢查轉換結果
      await info('PageService', `轉換後類型檢查: title=${typeof MultilingualString內容?.title?.toStringAsync}`);
      
      // 3. 處理多語言解析
      const 語言 = c?.get('語言') || 'zh-tw';
      const 多語言處理後內容 = this.處理多語言(MultilingualString內容, 語言);
      
      // 4. 將 MultilingualString 轉換為字串
      const 轉換後內容 = await this.轉換MultilingualString(多語言處理後內容, 語言);
      
      // 5. 取得當前骨架的佈局設定
      const 佈局方塊ID = await this.取得佈局方塊ID(c);
      
      // 6. 建構佈局內容，將頁面內容注入
      const 佈局內容 = await this.建構佈局內容(佈局方塊ID, 頁面實例.方塊, 轉換後內容, 語言);
      
      // 7. 使用動態解析器渲染佈局方塊
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
  private static async 取得佈局方塊ID(c?: Context): Promise<string> {
    try {
      await info('PageService', '取得佈局方塊ID');
      
      // 使用預設的 ClassicLayout
      const 預設佈局 = '方塊:方塊:cube-網站-經典';
      await info('PageService', `使用預設佈局方塊ID: ${預設佈局}`);
      return 預設佈局;
      
    } catch (err) {
      await error('PageService', `取得佈局方塊ID失敗: ${err.message}`);
      return '方塊:方塊:容器'; // fallback
    }
  }

  /**
   * 建構佈局內容，將頁面內容注入到佈局中
   */
  private static async 建構佈局內容(佈局方塊ID: string, 頁面方塊ID: string, 頁面內容: any, 語言: string): Promise<any> {
    try {
      await info('PageService', `建構佈局內容: ${佈局方塊ID} + ${頁面方塊ID}`);
      
      // TODO: 從 API 取得佈局方塊的結構定義
      // 目前返回預設的經典佈局結構
      const 佈局結構 = {
        direction: 'column',
        gap: 'none',
        children: [
          {
            方塊: '方塊:方塊:MainMenu',
            內容: {
              logo: {
                en: 'WebCube 2027',
                'zh-tw': 'WebCube 2027',
                vi: 'WebCube 2027'
              },
              menuItems: [
                { label: { en: 'Home', 'zh-tw': '首頁', vi: 'Trang chủ' }, href: '/' },
                { label: { en: 'About', 'zh-tw': '關於我們', vi: 'Về chúng tôi' }, href: '/about' },
                { label: { en: 'Contact', 'zh-tw': '聯絡我們', vi: 'Liên hệ' }, href: '/contact' }
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
              text: {
                en: '© 2026 WebCube 2027. All rights reserved.',
                'zh-tw': '© 2026 WebCube 2027. 版權所有。',
                vi: '© 2026 WebCube 2027. Đã đăng ký bản quyền.'
              },
              links: [
                { label: { en: 'Privacy', 'zh-tw': '隱私政策', vi: 'Chính sách bảo mật' }, href: '/privacy' },
                { label: { en: 'Terms', 'zh-tw': '使用條款', vi: 'Điều khoản sử dụng' }, href: '/terms' }
              ]
            }
          }
        ]
      };
      
      // 處理佈局結構中的多語言
      return this.處理多語言(佈局結構, 語言);
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
   * 將 JSON 內容轉換為 MultilingualString 物件
   */
  private static async 轉換JSON為MultilingualString(內容: any): Promise<any> {
    if (!內容 || typeof 內容 !== 'object') return 內容;
    
    // 導入 MultilingualString
    const { MultilingualString } = await import("@dui/smartmultilingual");
    
    const 轉換物件 = (obj: any): any => {
      // 檢查是否已經是 MultilingualString
      if (obj instanceof MultilingualString) {
        return obj;
      }
      
      // 檢查是否是多語言字串的 JSON 格式 - 更嚴格的檢查
      if (obj && typeof obj === 'object' && 
          (obj.en || obj['zh-tw'] || obj.vi || obj.zh || obj.ja || obj.ko) &&
          Object.keys(obj).every(key => typeof obj[key] === 'string')) {
        // 轉換為 MultilingualString 物件
        return new MultilingualString(obj);
      }
      
      if (typeof obj === 'string') {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(轉換物件);
      }
      
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = 轉換物件(value);
        }
        return result;
      }
      
      return obj;
    };
    
    return 轉換物件(內容);
  }

  /**
   * 將 MultilingualString 轉換為字串
   */
  private static async 轉換MultilingualString(內容: any, 語言: string): Promise<any> {
    if (!內容 || typeof 內容 !== 'object') return 內容;
    
    const 轉換物件 = async (obj: any): Promise<any> => {
      // 檢查是否是 MultilingualString (有 toStringAsync 方法)
      if (obj && typeof obj === 'object' && typeof obj.toStringAsync === 'function') {
        try {
          const result = await obj.toStringAsync(語言);
          return result;
        } catch (err) {
          await error('PageService', `toStringAsync 失敗: ${err.message}`);
          return obj['zh-tw'] || obj.en || obj.vi || '';
        }
      }
      
      if (typeof obj === 'string') {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return await Promise.all(obj.map(轉換物件));
      }
      
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = await 轉換物件(value);
        }
        return result;
      }
      
      return obj;
    };
    
    return await 轉換物件(內容);
  }

  /**
   * 處理多語言解析
   */
  private static 處理多語言(內容: any, 語言: string): any {
    if (!內容 || typeof 內容 !== 'object') return 內容;
    
    const 處理物件 = (obj: any): any => {
      // 檢查是否是多語言字串
      if (obj && typeof obj === 'object' && (obj.en || obj['zh-tw'] || obj.vi)) {
        // 優先順序：指定語言 > zh-tw > en > vi
        return obj[語言] || obj['zh-tw'] || obj.en || obj.vi || '';
      }
      
      if (typeof obj === 'string') {
        return obj;
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
    
    return 處理物件(內容);
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
      
      // 2. 使用 InnerAPI 從 page API 查找頁面
      const apiPath = 頁面路徑 === '/' ? '/api/v1/page/path' : `/api/v1/page/path${頁面路徑}`;
      
      const 頁面回應 = await InnerAPI(c, apiPath);
      const 頁面資料 = await 頁面回應.json();
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
