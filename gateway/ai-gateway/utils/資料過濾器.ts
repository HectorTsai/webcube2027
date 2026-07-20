// 資料過濾器 - 統一處理 API 回應資料的過濾邏輯
import { MultilingualString, MultilingualSmartContent, SmartContent } from "@dui/smartmultilingual";
import { 資料 } from "../database/index.ts";

/**
 * 資料過濾器類別
 * 提供統一的資料過濾邏輯，處理多國語言、安全欄位和巢狀物件
 */
export class 資料過濾器 {
  /**
   * 檢查是否為 id 欄位（巢狀物件參考）
   * 這些欄位只傳回 id 字串，不傳回完整物件
   */
  private static 是否為ID欄位(key: string, value: unknown): boolean {
    // 常見的 id 欄位模式
    const ID欄位模式 = ['配色', '骨架', '佈景主題', '裝飾', '圖示', '書本樣式'];
    
    // 如果是字串且符合 id 模式，且不是直接的 id 欄位
    if (typeof value === 'string' && 
        ID欄位模式.includes(key) && 
        key !== 'id') {
      return true;
    }
    
    return false;
  }

  /**
   * 檢查是否為安全字串（應該被過濾掉）
   * 直接檢查型態，而不是值
   */
  private static 是否為安全字串(value: unknown): boolean {
    if (!value) return false;
    
    // 檢查是否為 SecretString 實例
    const constructorName = value.constructor?.name;
    return constructorName === 'SecretString' || constructorName === 'SecurityString';
  }

  /**
   * 檢查是否為多國語言字串
   * 直接檢查型態
   */
  private static 是否為多國語言字串(value: unknown): boolean {
    if (!value) return false;
    return value instanceof MultilingualString;
  }

  /**
   * 檢查是否為多國語言格式的普通物件
   */
  private static 是否為多語言物件(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    
    // 檢查是否包含常見的語言鍵
    const 語言鍵 = ['en', 'zh-tw', 'zh-cn', 'vi'];
    return keys.some(key => 語言鍵.includes(key)) && 
           keys.every(key => typeof obj[key] === 'string');
  }

  /**
   * 檢查是否為智能內容
   * 直接檢查型態
   */
  private static 是否為智能內容(value: unknown): boolean {
    if (!value) return false;
    return value instanceof SmartContent || value instanceof MultilingualSmartContent;
  }

  /**
   * 簡化過濾 - 只保留基本欄位（id, 名稱, 描述）
   * 只接受資料庫物件，不接受 JSON 物件
   */
  static async 簡化過濾<T extends 資料>(data: T, language: string): Promise<Record<string, unknown>> {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const 結果: Record<string, unknown> = {};
    
    // 只保留基本欄位
    if ('id' in data) {
      結果.id = data.id;
    }
    
    if ('名稱' in data && data.名稱) {
      結果.名稱 = this.是否為多國語言字串(data.名稱) 
        ? await (data.名稱 as MultilingualString).toStringAsync(language) 
        : data.名稱;
    }
    
    if ('描述' in data && data.描述) {
      結果.描述 = this.是否為多國語言字串(data.描述) 
        ? await (data.描述 as MultilingualString).toStringAsync(language) 
        : this.是否為智能內容(data.描述)
        ? await (data.描述 as MultilingualSmartContent).toStringAsync(language)
        : data.描述;
    }
    
    // 如果有路徑，加入路徑
    if ('路徑' in data && data.路徑) {
      結果.路徑 = data.路徑;
    }

    return 結果;
  }

  /**
   * 遞迴處理物件中的多語言欄位
   */
  private static async 遞迴處理物件(obj: Record<string, unknown>, language: string): Promise<Record<string, unknown>> {
    const 結果: Record<string, unknown> = {};
    
    for (const [欄位名稱, 欄位值] of Object.entries(obj)) {
      // 處理多國語言字串
      if (this.是否為多國語言字串(欄位值)) {
        結果[欄位名稱] = await (欄位值 as MultilingualString).toStringAsync(language);
      }
      // 處理多語言格式的普通物件
      else if (this.是否為多語言物件(欄位值)) {
        const 多語言物件 = 欄位值 as Record<string, string>;
        結果[欄位名稱] = 多語言物件[language] || 多語言物件['zh-tw'] || 多語言物件['en'] || Object.values(多語言物件)[0];
      }
      // 處理智能內容
      else if (this.是否為智能內容(欄位值)) {
        if (欄位值 instanceof MultilingualSmartContent) {
          結果[欄位名稱] = await 欄位值.toStringAsync(language);
        } else if (欄位值 instanceof SmartContent) {
          結果[欄位名稱] = await (欄位值 as any).toStringAsync(language);
        }
      }
      // 遞迴處理巢狀物件
      else if (欄位值 && typeof 欄位值 === 'object' && !Array.isArray(欄位值)) {
        結果[欄位名稱] = await this.遞迴處理物件(欄位值 as Record<string, unknown>, language);
      }
      // 其他欄位直接保留
      else {
        結果[欄位名稱] = 欄位值;
      }
    }
    
    return 結果;
  }

  /**
   * 一般過濾 - 保留所有非敏感欄位，處理多國語言，巢狀物件只傳 id
   * 支援資料庫物件和 JSON 物件
   */
  static async 一般過濾<T extends 資料>(data: T, language: string): Promise<Record<string, unknown>> {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const 結果: Record<string, unknown> = {};
    
    for (const [欄位名稱, 欄位值] of Object.entries(data)) {
      // 跳過安全欄位 - SecretString 實例
      if (this.是否為安全字串(欄位值)) {
        continue;
      }
      
      // 處理編號物件 - 組合成字串格式的 id
      if (欄位名稱 === '編號' && 欄位值 && typeof 欄位值 === 'object') {
        const 編號物件 = 欄位值 as { _table: string; _type: string; _id: string };
        結果.id = `${編號物件._table}:${編號物件._type}:${編號物件._id}`;
      }
      // 處理多國語言字串 - MultilingualString 實例
      else if (this.是否為多國語言字串(欄位值)) {
        結果[欄位名稱] = await (欄位值 as MultilingualString).toStringAsync(language);
      }
      // 處理智能內容 - MultilingualSmartContent 或 SmartContent 實例
      else if (this.是否為智能內容(欄位值)) {
        if (欄位值 instanceof MultilingualSmartContent) {
          結果[欄位名稱] = await 欄位值.toStringAsync(language);
        } else if (欄位值 instanceof SmartContent) {
          結果[欄位名稱] = await (欄位值 as any).toStringAsync(language);
        }
      }
      // 巢狀物件直接傳回 id
      else if (this.是否為ID欄位(欄位名稱, 欄位值)) {
        結果[欄位名稱] = 欄位值;
      }
      // 處理巢狀物件 - 遞迴處理多語言欄位
      else if (欄位值 && typeof 欄位值 === 'object' && !Array.isArray(欄位值)) {
        結果[欄位名稱] = await this.遞迴處理物件(欄位值 as Record<string, unknown>, language);
      }
      // 其他欄位直接保留（但跳過編號，因為已處理）
      else if (欄位名稱 !== '編號') {
        結果[欄位名稱] = 欄位值;
      }
    }
    
    return 結果;
  }

  /**
   * 列表過濾 - 批量處理陣列資料
   * 只接受資料庫物件陣列，不接受 JSON 物件
   */
  static async 列表過濾<T extends 資料>(
    data: T[], 
    language: string, 
    type: 'simple' | 'full' = 'full'
  ): Promise<Record<string, unknown>[]> {
    if (!Array.isArray(data)) {
      return [];
    }

    const 過濾函數 = type === 'simple' ? this.簡化過濾.bind(this) : this.一般過濾.bind(this);
    
    return await Promise.all(
      data.map(項目 => 過濾函數(項目, language))
    );
  }

  /**
   * 單一資料過濾 - 自動選擇過濾類型
   * 只接受資料庫物件，不接受 JSON 物件
   */
  static async 過濾單一資料<T extends 資料>(
    data: T, 
    language: string, 
    type: 'simple' | 'full' = 'full'
  ): Promise<Record<string, unknown>> {
    const 過濾函數 = type === 'simple' ? this.簡化過濾.bind(this) : this.一般過濾.bind(this);
    return await 過濾函數(data, language);
  }
}
