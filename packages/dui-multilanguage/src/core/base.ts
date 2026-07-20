import { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGE_SET } from './types.ts';
import type { SupportedLanguage, MultilingualData } from './types.ts';

class MultilingualObject<T> {
  // deno-lint-ignore no-explicit-any
  [key: string]: any;

  protected constructor(data?: MultilingualData<T>) {
    if (data) {
      for (const [lang, value] of Object.entries(data)) {
        this.set(lang, value);
      }
    }
  }

  public get(key: string): T | undefined {
    if (!this.isSupportedLanguage(key)) return undefined;
    return this[key] as T | undefined;
  }

  public set(key: string, value: T | undefined): void {
    if (!this.isSupportedLanguage(key)) return;
    if (value === undefined) {
      delete this[key];
    } else {
      this[key] = value;
    }
  }

  /** 檢查是否有指定語言的內容 */
  public has(lang: SupportedLanguage): boolean {
    return this[lang] !== undefined;
  }

  public delete(lang: SupportedLanguage): boolean {
    if (!this.has(lang)) return false;
    delete this[lang];
    return true;
  }

  /** 取得所有可用的語言 */
  public getAllAvailableLanguages(): SupportedLanguage[] {
    return SUPPORTED_LANGUAGES.filter((lang) => this.has(lang)) as SupportedLanguage[];
  }

  /** 取得第一個可用的語言 */
  public getFirstAvailableLanguage(): SupportedLanguage | null {
    const available = this.getAllAvailableLanguages();
    return available.length > 0 ? available[0] : null;
  }

  /** 尋找最佳的來源語言 */
  public findBestSourceLanguage(preferredLang?: SupportedLanguage): SupportedLanguage | null {
    // 優先順序：指定語言 > 英文 > 中文繁體 > 第一個可用語言
    if (preferredLang && this.has(preferredLang)) return preferredLang;
    if (this.has("en")) return "en";
    if (this.has("zh-tw")) return "zh-tw";
    return this.getFirstAvailableLanguage();
  }

  /**
   * 轉換為純物件
   * @param languageSet 指定要轉換的語言集合，如果未指定則轉換所有支援的語言
   * @returns 純物件，包含指定語言的多國語言資料的 JSON 表示
   */
  public toJSON(languageSet?: SupportedLanguage[]): MultilingualData<T> {
    const result: Record<string, T> = {} as MultilingualData<T>;

    for (const lang of (languageSet || this.getAllAvailableLanguages())) {
      const data = this[lang] as T | undefined;
      if (data !== undefined) {
        result[lang] = data;
      }
    }

    return result as MultilingualData<T>;
  }

  /**
   * 轉換為字串表示
   * @returns JSON 字串表示
   */
  public toString(): string {
    return JSON.stringify(this.toJSON());
  }

  /**
   * 克隆物件
   * @returns 新的多國語言物件實例
   */
  public clone(): MultilingualObject<T> {
    return new MultilingualObject<T>(this.toJSON());
  }

  /**
   * 檢查對象是否為多國語言物件實例
   */
  public static is<T>(obj: unknown): obj is MultilingualObject<T> {
    return obj instanceof MultilingualObject;
  }

  /**
   * 合併其他多國語言物件
   */
  public static merge = <T>(
    ...objects: Array<MultilingualObject<T>>
  ): MultilingualObject<T> => {
    const merged = new MultilingualObject<T>();
    for (const obj of objects) {
      for (const lang of obj.getAllAvailableLanguages()) {
        merged.set(lang, obj.get(lang));
      }
    }
    return merged;
  };

  /**
   * 受保護的翻譯方法
   */
  protected async translate(
    host: string,
    from: SupportedLanguage,
    to: SupportedLanguage,
    text: string,
  ): Promise<string> {
    try {
      // 動態導入翻譯服務
      const { getTranslation } = await import('./translation.ts');
      const translationService = getTranslation();
      return await translationService.translate(from, to, text, host);
    } catch (e: unknown) {
      console.error(`[MultilingualObject] 翻譯失敗 ${from} -> ${to}: ${text} => Fail`);
      console.log(e);
      return text;
    }
  }

  private isSupportedLanguage(lang: string): lang is SupportedLanguage {
    return SUPPORTED_LANGUAGE_SET.has(lang as SupportedLanguage);
  }
}

export { MultilingualObject };
export default MultilingualObject;
