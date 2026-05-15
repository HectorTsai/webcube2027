// 語言服務 - 處理語言檢查和驗證

import { Context } from 'hono';
import { error } from '../../utils/logger.ts';
import { InnerAPI } from '../index.ts'; // 引入我們封裝好、自帶 Cookie 透傳的內部 API 工具

// 語言服務介面
export interface ILanguageService {
  檢查語言支援(c: Context, language: string): Promise<boolean>;
  取得支援語言(c: Context): Promise<string[]>;
  驗證語言(c: Context, language: string): Promise<string>;
}

// 語言服務實作
class LanguageServiceImpl implements ILanguageService {
  
  /**
   * 檢查語言是否支援
   * 修正：對接 InnerAPI 確保 Session/Cookie 不丟失，防止架構死結
   */
  async 檢查語言支援(c: Context, language: string): Promise<boolean> {
    try {
      // 1. 優先從「取得支援語言」拿資料（該方法自帶 Context 緩存優化）
      const 支援語言列表 = await this.取得支援語言(c);
      
      // 2. 檢查語言是否在支援列表中
      return 支援語言列表.includes(language);
      
    } catch (err) {
      await error('語言服務', `檢查語言支援失敗: ${err}`);
      return false; // 發生錯誤時保守返回不支援
    }
  }
  
  /**
   * 取得支援的語言列表
   * 優化：整合分散的 Context 欄位，並將 API 查詢結果回寫緩存，大幅提升重複調用效能
   */
  async 取得支援語言(c: Context): Promise<string[]> {
    try {
      // 1. 優先從 Context 取得已快取的語言列表
      const 快取語言 = c.get('支援語言列表');
      if (快取語言 && Array.isArray(快取語言)) {
        return 快取語言;
      }

      // 2. 降級相容：嘗試從現有的其他 Context 欄位提取
      const 網站資訊 = c.get('網站資訊');
      if (網站資訊?.語言 && Array.isArray(網站資訊.語言)) {
        c.set('支援語言列表', 網站資訊.語言); // 補回快取
        return 網站資訊.語言;
      }
      
      const 系統資訊 = c.get('系統資訊');
      if (系統資訊?.語言 && Array.isArray(系統資訊.語言)) {
        c.set('支援語言列表', 系統資訊.語言); // 補回快取
        return 系統資訊.語言;
      }
      
      // 3. 若無快取，使用 InnerAPI 發送帶有完整使用者身分憑證的內部請求
      const 資訊回應 = await InnerAPI(c, '/api/v1/info');
      const 資訊 = await 資訊回應.json();
      
      if (資訊.success && 資訊.data?.語言 && Array.isArray(資訊.data.語言)) {
        const 支援語言 = 資訊.data.語言 as string[];
        // 將結果寫入 Context 緩存，供當次請求後續的所有核心 Service 直接複用
        c.set('支援語言列表', 支援語言);
        return 支援語言;
      }
      
      // 4. 萬一 API 沒給陣列，回傳系統預設語系防線
      return ['zh-tw'];
      
    } catch (err) {
      await error('語言服務', `取得支援語言失敗: ${err}`);
      return ['zh-tw']; // 錯誤時回傳預設語言
    }
  }
  
  /**
   * 驗證語言並回傳有效的語言
   */
  async 驗證語言(c: Context, language: string): Promise<string> {
    try {
      // 1. 檢查語言是否支援
      const isSupported = await this.檢查語言支援(c, language);
      
      if (isSupported) {
        return language;
      }
      
      // 2. 如果不支援，取得預設語言
      const 支援語言 = await this.取得支援語言(c);
      const 系統資訊 = c.get('系統資訊');
      const 預設語言 = 系統資訊?.預設語言 || 'zh-tw';
      
      // 如果預設語言在支援列表中，使用預設語言
      if (支援語言.includes(預設語言)) {
        return 預設語言;
      }
      
      // 否則使用第一個支援的語言
      return 支援語言.length > 0 ? 支援語言[0] : 'zh-tw';
      
    } catch (err) {
      await error('語言服務', `驗證語言失敗: ${err}`);
      return 'zh-tw'; // 錯誤時回傳預設語言
    }
  }
}

// 建立語言服務實例
const languageService = new LanguageServiceImpl();

// 導出語言服務
export default languageService;