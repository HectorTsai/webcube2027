import { MultilingualString } from "@dui/smartmultilingual";
import 動態方塊JSX解析器 from "./動態方塊JSX解析器.ts";
import 頁面 from "../../database/models/頁面.ts";
import 方塊 from "../../database/models/方塊.ts";
import { info, error } from "../../utils/logger.ts";
import { 三層查詢管理器 } from '../../database/core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
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
      // 1. 取得支援的語言列表
      const 支援語言 = await languageService.取得支援語言(c);
      
      // 2. 檢查是否是語言前綴格式
      const match = path.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)?$/);
      if (match) {
        const [, 語言前綴, 頁面路徑部分] = match;
        const 頁面路徑 = 頁面路徑部分 || '/';
        
        // 3. 驗證語言是否支援
        const isSupported = await languageService.檢查語言支援(c, 語言前綴);
        if (isSupported) {
          return { 語言: 語言前綴, 頁面路徑 };
        } else {
          return null; // 404 - 語言不支援
        }
      }
      
      // 3. 檢查 Cookie 中的語言
      const cookieHeader = c.req.header('Cookie');
      const cookieLang = cookieHeader?.match(/lang=([^;]+)/)?.[1];
      if (cookieLang) {
        const isSupported = await languageService.檢查語言支援(c, cookieLang);
        if (isSupported) {
          return { 語言: cookieLang, 頁面路徑: path };
        }
      }
      
      // 4. 没有語言前綴，使用預設語言
      const 系統資訊 = c.get('系統資訊');
      const 預設語言 = 系統資訊?.預設語言 || 'zh-tw';
      
      if (支援語言.includes(預設語言)) {
        return { 語言: 預設語言, 頁面路徑: path };
      }
      
      const 第一個支援語言 = 支援語言.length > 0 ? 支援語言[0] : 'zh-tw';
      return { 語言: 第一個支援語言, 頁面路徑: path };
      
    } catch (err: any) {
      await error('PageService', `URL路徑解析失敗: ${err.message}`);
      return null;
    }
  }

  /**
   * 渲染頁面 - 主要入口點
   * 修正：完美對接深度參數防禦，並優化多語言異步生命週期順序
   */
  static async renderPage(頁面實例: any, 路由參數: any, c: any): Promise<string> {
    try {
      // 1. 處理路徑參數替換
      const 處理後內容 = this.處理路徑參數(頁面實例.內容, 路由參數);
      
      // 2. 將 JSON 內容轉換為 MultilingualString 物件
      let MultilingualString內容 = await this.轉換JSON為MultilingualString(處理後內容);
      
      // 3. 進行非同步 MultilingualString 轉換（此步驟會完美執行內部 toStringAsync 並返回對應語系字串）
      const 語言 = c?.get('語言') || 'zh-tw';
      const 轉換後內容 = await this.轉換MultilingualString(MultilingualString內容, 語言);
      
      // 6. 取得當前骨架的佈局設定
      const 佈局方塊ID = await this.取得佈局方塊ID(c);
      
      // 7. 將方塊結構轉換為 JSX 元件 (正確帶入初始深度 0 傳遞給遞迴函數)
      const childrenJSX = await this.渲染方塊結構為JSX(轉換後內容, c, 0);
      
      // 8. 取得網站資訊並處理佈局資料
      const { InnerAPI } = await import('../../services/index.ts');
      const 網站資訊Response = await InnerAPI(c!, "/api/v1/info");
      const 網站資訊 = await 網站資訊Response.json();
      
      // 9. 處理主選單
      const menuItems = [];
      for (const 頁面ID of 網站資訊.data?.主選單 || []) {
        try {
          const 頁面Response = await InnerAPI(c!, `/api/v1/cube/${頁面ID}`);
          const 頁面資料 = await 頁面Response.json();
          menuItems.push({
            label: 頁面資料.data?.標題,  
            href: 頁面資料.data?.路徑 || '/'
          });
        } catch (err: any) {
          return this.渲染錯誤頁面(err);
        }
      }
      
      // 10. 處理版權資料
      const 版權資料 = 網站資訊.data?.版權資料 || {};
      const companyName = 版權資料.公司 || "WebCube 2027";
      const companyUrl = 版權資料.網址 || "";
      const logo = 網站資訊.data?.商標 || "";
      const siteName = 網站資訊.data?.名稱 || "WebCube";
      
      // 11. 組合佈局參數
      const 佈局參數 = {
        children: childrenJSX,
        context: c
      };
      
      // 渲染外部佈局方塊 (佈局作為最頂層，傳入初始深度 0)
      const 佈局JSX = await 動態方塊JSX解析器.解析(佈局方塊ID, 佈局參數, c, 0);
      
      // 將最終 JSX 轉為 HTML
      const html = 佈局JSX.toString();
      
      return html;
    } catch (err: any) {
      await error('PageService', `頁面渲染失敗: ${err.message}`);
      return this.渲染錯誤頁面(err);
    }
  }

  /**
   * 取得當前骨架的佈局方塊ID
   */
  private static async 取得佈局方塊ID(c?: Context): Promise<string> {
    try {
      const 預設佈局 = '方塊:方塊:cube-網站-經典';
      return 預設佈局;
    } catch (err: any) {
      await error('PageService', `取得佈局方塊ID失敗: ${err.message}`);
      return '方塊:方塊:容器';
    }
  }

  private static async 轉換JSON為MultilingualString(內容: any): Promise<any> {
    if (!內容 || typeof 內容 !== 'object') return 內容;
        
    const 轉換物件 = (obj: any): any => {
      if (obj instanceof MultilingualString) {
        return obj;
      }
      
      if (obj && typeof obj === 'object' && 
          (obj.en || obj['zh-tw'] || obj.vi || obj.zh || obj.ja || obj.ko) &&
          Object.keys(obj).every(key => typeof obj[key] === 'string')) {
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
      if (obj && typeof obj === 'object' && typeof obj.toStringAsync === 'function') {
        try {
          const result = await obj.toStringAsync(語言);
          return result;
        } catch (err: any) {
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
   * 處理多語言解析（保留作為單純工具函數，不與 renderPage 的生命週期衝突）
   */
  private static 處理多語言(內容: any, 語言: string): any {
    if (!內容 || typeof 內容 !== 'object') return 內容;
    
    const 處理物件 = (obj: any): any => {
      if (obj && typeof obj === 'object' && (obj.en || obj['zh-tw'] || obj.vi)) {
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
      let 實際頁面路徑 = path;
      
      const match = path.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)?$/);
      if (match) {
        const [, _語言前綴, 頁面路徑部分] = match;
        實際頁面路徑 = 頁面路徑部分 || '/';
      }
      
      const apiPath = 實際頁面路徑 === '/' ? '/api/v1/page/path' : `/api/v1/page/path${實際頁面路徑}`;
      
      const response = await InnerAPI(c, apiPath);
      const data = await response.json();
      
      if (data.success && data.data) {
        const pageInstance = new 頁面(data.data, false);
        return pageInstance;
      }
      
      return null;
      
    } catch (err:any) {
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

  /**
   * 將方塊結構渲染為 JSX
   * 修正：加入 深度 參數，與「動態方塊JSX解析器」的安全防禦防線完美對接
   */
  private static async 渲染方塊結構為JSX(結構: any, c: any, 深度: number = 0): Promise<any> {
    try {
      if (!結構 || typeof 結構 !== 'object') {
        return String(結構 || '');
      }

      if (typeof 結構 === 'string') {
        return 結構;
      }

      if (Array.isArray(結構)) {
        const jsx陣列 = await Promise.all(
          結構.map(item => this.渲染方塊結構為JSX(item, c, 深度))
        );
        return jsx陣列;
      }

      if (結構.方塊) {
        return await 動態方塊JSX解析器.解析(結構.方塊, 結構.內容, c, 深度);
      }

      const 新物件: any = {};
      for (const [key, value] of Object.entries(結構)) {
        新物件[key] = await this.渲染方塊結構為JSX(value, c, 深度);
      }
      return 新物件;

    } catch (err: any) {
      await error('PageService', `渲染方塊結構為JSX失敗: ${err.message}`);
      return String(結構 || '');
    }
  }
}