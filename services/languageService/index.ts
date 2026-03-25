// 語言服務 - 處理語言檢查和驗證
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';

// 語言服務介面
export interface ILanguageService {
  // 檢查語言是否支援
  檢查語言支援(c: Context, language: string): Promise<boolean>;
  // 取得支援的語言列表
  取得支援語言(c: Context): Promise<string[]>;
  // 驗證語言並回傳有效的語言
  驗證語言(c: Context, language: string): Promise<string>;
}

// 語言服務實作
class LanguageServiceImpl implements ILanguageService {
  // 檢查語言是否支援
  async 檢查語言支援(c: Context, language: string): Promise<boolean> {
    try {
      await info('語言服務', `檢查語言支援: ${language}`);
      
      // 1. 取得統一資訊
      const app = c.get('app');
      const 資訊回應 = await app.request('/api/v1/info');
      const 資訊 = await 資訊回應.json();
      
      if (!資訊.success || !資訊.data) {
        await error('語言服務', '無法取得資訊，預設不支援語言');
        return false;
      }
      
      const 資訊資料 = 資訊.data;
      
      // 2. 檢查是否有語言陣列
      if (!資訊資料.語言 || !Array.isArray(資訊資料.語言)) {
        await info('語言服務', '資訊中沒有語言陣列，預設支援所有語言');
        return true; // 如果沒有語言限制，預設支援
      }
      
      // 3. 檢查語言是否在支援列表中
      const 支援語言 = 資訊資料.語言 as string[];
      const isSupported = 支援語言.includes(language);
      
      await info('語言服務', `語言 ${language} ${isSupported ? '支援' : '不支援'}`);
      return isSupported;
      
    } catch (err) {
      await error('語言服務', `檢查語言支援失敗: ${err}`);
      return false;
    }
  }
  
  // 取得支援的語言列表
  async 取得支援語言(c: Context): Promise<string[]> {
    try {
      await info('語言服務', '取得支援語言列表');
      
      // 1. 先嘗試從 context 取得網站資訊
      const 網站資訊 = c.get('網站資訊');
      if (網站資訊 && 網站資訊.語言 && Array.isArray(網站資訊.語言)) {
        const 支援語言 = 網站資訊.語言;
        await info('語言服務', `從網站資訊取得支援語言: ${支援語言.join(', ')}`);
        return 支援語言;
      }
      
      // 2. 如果網站資訊不存在，從 context 取得系統資訊
      const 系統資訊 = c.get('系統資訊');
      if (!系統資訊) {
        await error('語言服務', '無法取得系統資訊，回傳預設語言');
        return ['zh-tw'];
      }
      
      // 檢查是否有語言陣列
      if (!系統資訊.語言 || !Array.isArray(系統資訊.語言)) {
        await info('語言服務', '系統資訊中沒有語言陣列，回傳預設語言');
        return ['zh-tw'];
      }
      
      const 支援語言 = 系統資訊.語言;
      await info('語言服務', `從系統資訊取得支援語言: ${支援語言.join(', ')}`);
      return 支援語言;
      
    } catch (err) {
      await error('語言服務', `取得支援語言失敗: ${err}`);
      return ['zh-tw']; // 錯誤時回傳預設語言
    }
  }
  
  // 驗證語言並回傳有效的語言
  async 驗證語言(c: Context, language: string): Promise<string> {
    try {
      await info('語言服務', `驗證語言: ${language}`);
      
      // 1. 檢查語言是否支援
      const isSupported = await this.檢查語言支援(c, language);
      
      if (isSupported) {
        await info('語言服務', `語言 ${language} 驗證通過`);
        return language;
      }
      
      // 2. 如果不支援，取得第一個支援的語言
      const 支援語言 = await this.取得支援語言(c);
      const 預設語言 = 支援語言.length > 0 ? 支援語言[0] : 'zh-tw';
      
      await info('語言服務', `語言 ${language} 不支援，使用預設語言: ${預設語言}`);
      return 預設語言;
      
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

