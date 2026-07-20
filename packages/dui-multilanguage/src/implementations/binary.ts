import MultilingualObject from '../core/base.ts';
import type { MultilingualData, SupportedLanguage } from '../core/types.ts';

/**
 * 多國語言二進位物件類別
 * 專門處理多國語言的二進位內容
 */
export default class MultilingualBinary extends MultilingualObject<Uint8Array> {
  /**
   * 創建多國語言二進位物件實例
   * @param data 可選的初始資料
   */
  public constructor(data?: MultilingualData<Uint8Array>) {
    super(data);
  }

  /**
   * 從 Uint8Array 建立多國語言二進位物件
   * @param data 二進位資料
   * @param lang 語言代碼（預設為 'en'）
   * @returns MultilingualBinary 實例
   */
  public static from(data: Uint8Array, lang: string = 'en'): MultilingualBinary {
    return new MultilingualBinary({ [lang]: data });
  }

  /**
   * 從字串建立多國語言二進位物件
   * @param text 文字內容
   * @param lang 語言代碼（預設為 'en'）
   * @returns MultilingualBinary 實例
   */
  public static fromString(text: string, lang: string = 'en'): MultilingualBinary {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    return MultilingualBinary.from(data, lang);
  }

  /**
   * 從 Base64 字串建立多國語言二進位物件
   * @param base64 Base64 編碼的字串
   * @param lang 語言代碼（預設為 'en'）
   * @returns MultilingualBinary 實例
   */
  public static fromBase64(base64: string, lang: string = 'en'): MultilingualBinary {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return MultilingualBinary.from(bytes, lang);
  }

  /**
   * 取得指定語言的二進位資料
   * @param lang 語言代碼
   * @returns 二進位資料，如果不存在則返回 undefined
   */
  public getData(lang: string): Uint8Array | undefined {
    return this.get(lang);
  }

  /**
   * 設定指定語言的二進位資料
   * @param lang 語言代碼
   * @param data 二進位資料
   */
  public setData(lang: string, data: Uint8Array): void {
    this.set(lang, data);
  }

  /**
   * 轉換為 Base64 字串
   * @param lang 指定語言，如果未指定則使用第一個可用語言
   * @returns Base64 編碼的字串
   */
  public toBase64(lang?: string): string {
    const data = lang ? this.getData(lang) : this.toUint8Array();
    if (!data) return '';

    // 使用更安全的方式轉換大型 Uint8Array 為 base64
    const chunkSize = 0x8000; // 32KB chunks
    const chunks: string[] = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = Array.from(data.subarray(i, i + chunkSize));
      chunks.push(String.fromCharCode(...chunk));
    }
    return btoa(chunks.join(""));
  }

  /**
   * 轉換為 Uint8Array
   * @param lang 指定語言，如果未指定則使用第一個可用語言
   * @returns Uint8Array
   */
  public toUint8Array(lang?: string): Uint8Array {
    if (lang) {
      return this.getData(lang) || new Uint8Array();
    }
    // 如果沒有指定語言，返回第一個可用的語言
    const firstLang = this.getFirstAvailableLanguage();
    return firstLang ? this.getData(firstLang) || new Uint8Array() : new Uint8Array();
  }

  /**
   * 轉換為字串
   * @param lang 指定語言，如果未指定則使用第一個可用語言
   * @returns 文字表示
   */
  public override toString(lang?: string): string {
    const data = this.toUint8Array(lang);
    try {
      // 嘗試 UTF-8 解碼
      return new TextDecoder("utf-8").decode(data);
    } catch (_e) {
      // 如果解碼失敗，返回 base64 表示
      return this.toBase64(lang);
    }
  }

  /**
   * 取得資料大小（位元組）
   * @param lang 指定語言，如果未指定則使用第一個可用語言
   * @returns 資料大小
   */
  public size(lang?: string): number {
    const data = this.toUint8Array(lang);
    return data.length;
  }

  /**
   * 檢查是否為空
   * @param lang 指定語言，如果未指定則檢查是否所有語言都為空
   * @returns 是否為空
   */
  public isEmpty(lang?: string): boolean {
    if (lang) {
      const data = this.getData(lang);
      return !data || data.length === 0;
    }
    return this.getAllAvailableLanguages().every(lang => this.isEmpty(lang));
  }

  /**
   * 比較兩個二進位資料是否相等
   * @param other 要比較的 MultilingualBinary 實例
   * @param lang 指定語言，如果未指定則比較所有語言
   * @returns 是否相等
   */
  public equals(other: MultilingualBinary, lang?: string): boolean {
    if (lang) {
      const thisData = this.getData(lang);
      const otherData = other.getData(lang);

      if (!thisData && !otherData) return true;
      if (!thisData || !otherData) return false;

      if (thisData.length !== otherData.length) return false;

      for (let i = 0; i < thisData.length; i++) {
        if (thisData[i] !== otherData[i]) return false;
      }
      return true;
    }

    // 比較所有語言
    const thisLangs = new Set(this.getAllAvailableLanguages());
    const otherLangs = new Set(other.getAllAvailableLanguages());

    if (thisLangs.size !== otherLangs.size) return false;

    for (const lang of thisLangs) {
      if (!otherLangs.has(lang) || !this.equals(other, lang)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 複製實例
   * @returns 新的 MultilingualBinary 實例
   */
  public override clone(): MultilingualBinary {
    const newData: MultilingualData<Uint8Array> = {};

    for (const [lang, data] of Object.entries(this.toJSON())) {
      newData[lang] = new Uint8Array(data);
    }

    return new MultilingualBinary(newData);
  }
}
