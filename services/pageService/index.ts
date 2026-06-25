import { MultilingualString } from "@dui/smartmultilingual";
import { jsx } from "hono/jsx";
import Cube from "../../components/方塊.tsx";
import 頁面 from "../../database/models/頁面.ts";
import { info, error } from "../../utils/logger.ts";
import { 安全過濾 } from "../../utils/安全過濾器.ts";
import { InnerAPI, 取得語言 } from "../index.ts";
import { Context } from "hono";
import languageService from "../languageService/index.ts";

// 🎯 效能優化：正則表達式提升至模組頂層，編譯一次終身複用
const LANG_PREFIX_RE = /^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)?$/;

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
      const match = path.match(LANG_PREFIX_RE);
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
      const 預設語言 = await 取得語言(c);
      
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
   * 直接對接 Cube 系統，消滅中間層動態解析器
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

      // 3.5 安全過濾：遞迴過濾所有 string 值，移除 script/inline event/危險 URI
      const 安全內容 = this.安全過濾內容(轉換後內容);
      
      // 4. 取得當前骨架的佈局方塊ID
      const 佈局方塊ID = await this.取得佈局方塊ID(c);
      
      // 5. 分離 children 與其他 args，建構頁面 JSX
      //    內容格式已對齊 Cube：{ direction, gap, children: [{ from:..., title: ..., ...}, ...] }
      const { children: 頁面children, ...頁面args } = 安全內容;
      const 頁面Root方塊ID = 頁面實例.方塊 || '方塊:方塊:容器';
      const 頁面JSX = jsx(Cube as any, {
        definition: { from: 頁面Root方塊ID, children: 頁面children } as Partial<typeof Cube>,
        args: 頁面args,
        depth: 0,
        context: c
      } as any);
      
      // 6. 將頁面 JSX 注入佈局的 content slot（對齊 test/基礎佈局.tsx 用法）
      const 佈局JSX = jsx(Cube as any, {
        from: 佈局方塊ID,
        slots: { content: 頁面JSX },
        context: c
      } as any);
      
      // 7. 將最終 JSX 轉為 HTML
      const html = (佈局JSX as any)?.toString() ?? '';
      
      return html;
    } catch (err: any) {
      await error('PageService', `頁面渲染失敗: ${err.message}`);
      return this.渲染錯誤頁面(err);
    }
  }

  /**
   * 取得當前骨架的佈局方塊ID
   * 從主題 → 骨架 → 佈局欄位，依序查詢，任一環節失敗則回退到基礎佈局
   */
  private static async 取得佈局方塊ID(c?: Context): Promise<string> {
    try {
      if (!c) return '方塊:方塊:基礎佈局';
      
      // 1. 取得當前佈景主題
      const 主題回應 = await InnerAPI(c, '/api/v1/theme');
      if (!主題回應.ok) return '方塊:方塊:基礎佈局';
      
      const 主題資料 = await 主題回應.json();
      if (!主題資料.success || !主題資料.data?.骨架) return '方塊:方塊:基礎佈局';
      
      // 2. 取得骨架完整資料
      const 骨架回應 = await InnerAPI(c, `/api/v1/skeleton?id=${encodeURIComponent(主題資料.data.骨架)}`);
      if (!骨架回應.ok) return '方塊:方塊:基礎佈局';
      
      const 骨架資料 = await 骨架回應.json();
      if (!骨架資料.success || !骨架資料.data) return '方塊:方塊:基礎佈局';
      
      // 3. 回傳骨架的佈局方塊 ID
      const 佈局ID = 骨架資料.data.佈局 || '方塊:方塊:基礎佈局';
      return 佈局ID;
      
    } catch (err: any) {
      await error('PageService', `取得佈局方塊ID失敗: ${err.message}`);
      return '方塊:方塊:基礎佈局';
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
   * 遞迴安全過濾頁面內容中的所有 string 值
   */
  private static 安全過濾內容(內容: any): any {
    if (typeof 內容 === "string") return 安全過濾(內容);
    if (!內容 || typeof 內容 !== "object") return 內容;
    if (Array.isArray(內容)) return 內容.map((v) => this.安全過濾內容(v));
    const result: any = {};
    for (const [k, v] of Object.entries(內容)) {
      result[k] = this.安全過濾內容(v);
    }
    return result;
  }

  /**
   * 根據路徑查找頁面（支援多語言路由）
   */
  static async findPageByPath(path: string, c: Context): Promise<頁面 | null> {
    try {
      let 實際頁面路徑 = path;
      
      const match = path.match(LANG_PREFIX_RE);
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
}