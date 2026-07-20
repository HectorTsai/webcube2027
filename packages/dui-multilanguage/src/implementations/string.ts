import MultilingualObject from '../core/base.ts';
import type { SupportedLanguage } from '../core/types.ts';

/**
 * 多國語言字串類別
 * 專門處理多國語言的文字內容
 */
export default class MultilingualString extends MultilingualObject<string> {
  /**
   * 創建多國語言字串實例
   * @param data 可選的初始資料，接受任何語言代碼的物件
   */
  public constructor(data?: { [key: string]: string } | undefined | null) {
    super();
    if (data) {
      for (const [lang, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          this.set(lang, value);
        }
      }
    }
  }

  /**
   * 從字串建立多國語言字串
   * @param text 文字內容
   * @param lang 語言代碼（預設為 'en'）
   * @returns MultilingualString 實例
   */
  public static from(text: string, lang: string = 'en'): MultilingualString {
    return new MultilingualString({ [lang]: text });
  }

  /**
   * 取得指定語言的文字內容
   * @param lang 語言代碼
   * @returns 文字內容，如果不存在則返回 undefined
   */
  public getText(lang: string): string | undefined {
    return this.get(lang);
  }

  /**
   * 設定指定語言的文字內容
   * @param lang 語言代碼
   * @param text 文字內容
   */
  public setText(lang: string, text: string): void {
    this.set(lang, text);
  }

  /**
   * 取得文字內容，自動處理語言回退
   * @param preferredLang 偏好語言
   * @param fallbackLang 回退語言（預設為 'en'）
   * @returns 文字內容
   */
  public getTextWithFallback(preferredLang: string, fallbackLang: string = 'en'): string {
    return this.getText(preferredLang) || this.getText(fallbackLang) || '';
  }

  /**
   * 取得指定語言的文字內容，若無則翻譯並快取
   * @param lang 目標語言
   * @param host 可選的來源 host
   */
  public async toStringAsync(lang: SupportedLanguage, host?: string): Promise<string> {
    const existing = this.getText(lang);
    if (existing !== undefined) return existing;

    const sourceLang = super.findBestSourceLanguage();
    if (!sourceLang) return '';

    const sourceText = this.getText(sourceLang);
    if (!sourceText) return '';

    const translated = await this.translate(host ?? '', sourceLang, lang, sourceText);
    this.setText(lang, translated);
    return translated;
  }

  /**
   * 轉換為字串表示
   * @param lang 指定的語言
   * @returns 字串表示
   */
  public override toString(lang?: string): string {
    if (lang) {
      return this.getText(lang) || '';
    }
    // 如果沒有指定語言，返回第一個可用的語言
    const firstLang = super.getFirstAvailableLanguage();
    return firstLang ? this.getText(firstLang) || '' : '';
  }

  /**
   * 檢查是否包含指定文字
   * @param text 要檢查的文字
   * @param caseSensitive 是否區分大小寫（預設為 false）
   * @returns 是否包含
   */
  public contains(text: string, caseSensitive: boolean = false): boolean {
    for (const lang of super.getAllAvailableLanguages()) {
      const content = this.getText(lang);
      if (content) {
        const comparison = caseSensitive ? content : content.toLowerCase();
        const searchText = caseSensitive ? text : text.toLowerCase();
        if (comparison.includes(searchText)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 取代文字內容
   * @param searchValue 要取代的值
   * @param replaceValue 取代的值
   * @param langs 指定要取代的語言，如果未指定則取代所有語言
   * @returns 新的 MultilingualString 實例
   */
  public replace(searchValue: string | RegExp, replaceValue: string, langs?: string[]): MultilingualString {
    const targetLangs = langs || super.getAllAvailableLanguages();
    const newData: Record<string, string> = {};

    for (const lang of targetLangs) {
      const content = this.getText(lang);
      if (content) {
        newData[lang] = content.replace(searchValue, replaceValue);
      }
    }

    return new MultilingualString(newData);
  }

  /**
   * 取得文字長度
   * @param lang 指定語言，如果未指定則返回第一個可用語言的長度
   * @returns 文字長度
   */
  public length(lang?: string): number {
    const text = lang ? this.getText(lang) : this.toString();
    return text ? text.length : 0;
  }

  /**
   * 檢查是否為空
   * @param lang 指定語言，如果未指定則檢查是否所有語言都為空
   * @returns 是否為空
   */
  public isEmpty(lang?: SupportedLanguage): boolean {
    if (lang) {
      const text = this.getText(lang);
      return !text || text.trim().length === 0;
    }
    return super.getAllAvailableLanguages().every((lang: SupportedLanguage) => this.isEmpty(lang));
  }

  /**
   * 複製實例
   * @returns 新的 MultilingualString 實例
   */
  public override clone(): MultilingualString {
    const data: Record<string, string> = {};
    for (const lang of super.getAllAvailableLanguages()) {
      const text = this.getText(lang);
      if (text) data[lang] = text;
    }
    return new MultilingualString(data);
  }
}
