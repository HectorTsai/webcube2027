import MultilingualObject from '../core/base.ts';
import { SmartContent } from '../core/content/smart-content.ts';
import { ContentRenderer } from '../core/content/renderer.ts';
import type { MultilingualData, SupportedLanguage } from '../core/types.ts';
import type { SupportedFormat } from '../utils/file/formats.ts';

/**
 * 多國語言智慧內容類別
 * 結合多國語言處理和智慧內容載入的終極解決方案
 */
export default class MultilingualSmartContent extends MultilingualObject<SmartContent> {
  /**
   * 創建多國語言智慧內容實例
   * @param data 可選的初始資料，接受任何語言代碼的物件
   */
  public constructor(
    data?: { [key: string]: SmartContent | { format: string; content: string | Uint8Array } } | undefined | null,
  ) {
    super();

    if (data) {
      for (const [lang, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          if (value instanceof SmartContent) {
            this.set(lang as SupportedLanguage, value);
          } else if (value && typeof value === "object" && "format" in value && "content" in value) {
            this.set(lang as SupportedLanguage, new SmartContent({
              format: value.format as SupportedFormat,
              content: value.content,
            }));
          }
        }
      }
    }
  }

  /**
   * 取得指定語言的內容文字表示；若不存在則自動翻譯（僅文字/Markdown），SVG 不翻譯
   */
  public async toStringAsync(lang: SupportedLanguage, host?: string): Promise<string> {
    const existing = this.getSmartContent(lang);
    if (existing) {
      await existing.fetchAsync();
      const content = existing.content;
      return typeof content === "string" ? content : '';
    }

    const sourceLang = this.findBestSourceLanguage();
    if (!sourceLang) return '';

    const sourceContent = this.getSmartContent(sourceLang);
    if (!sourceContent) return '';

    await sourceContent.fetchAsync();
    const content = sourceContent.content;

    // SVG 或二進位內容不進行翻譯，直接回傳
    if (sourceContent.format === "SVG" || sourceContent.isBinaryFormat) {
      const cloned = sourceContent.clone();
      this.setSmartContent(lang, cloned);
      return typeof content === "string" ? content : '';
    }

    if (typeof content !== "string") return '';

    const translated = await this.translate(host ?? '', sourceLang, lang, content);
    const newContent = new SmartContent({ format: sourceContent.format, content: translated });
    this.setSmartContent(lang, newContent);
    return translated;
  }

  /**
   * 從多國語言資料建立實例
   */
  public static fromData(
    data: MultilingualData<{ format: string; content: string | Uint8Array }>
  ): MultilingualSmartContent {
    const instance = new MultilingualSmartContent();
    for (const [lang, content] of Object.entries(data)) {
      instance.set(lang as SupportedLanguage, new SmartContent({
        format: content.format as SupportedFormat,
        content: content.content,
      }));
    }
    return instance;
  }

  /**
   * 取得指定語言的智慧內容
   */
  public getSmartContent(lang: SupportedLanguage): SmartContent | undefined {
    return this.get(lang);
  }

  /**
   * 設定指定語言的智慧內容
   */
  public setSmartContent(lang: SupportedLanguage, content: SmartContent): void {
    this.set(lang, content);
  }

  /**
   * 非同步渲染內容
   * @param lang 指定語言
   * @param format 輸出格式
   * @param converters 內容轉換器
   */
  public async renderAsync(
    lang: SupportedLanguage,
    format: "TEXT" | "HTML" | "MARKDOWN" = "TEXT",
    converters?: Record<string, unknown>
  ): Promise<string> {
    const content = this.getSmartContent(lang);
    if (!content) return '';

    await content.fetchAsync();
    return ContentRenderer.render(content, format, converters);
  }

  /**
   * 尋找支援指定格式的語言
   */
  public findLanguagesByFormat(format: string): SupportedLanguage[] {
    const result: SupportedLanguage[] = [];

    for (const lang of this.getAllAvailableLanguages()) {
      const content = this.getSmartContent(lang);
      if (content && content.format === format) {
        result.push(lang);
      }
    }

    return result;
  }

  /**
   * 尋找支援文字格式的語言
   */
  public findTextLanguages(): SupportedLanguage[] {
    const result: SupportedLanguage[] = [];

    for (const lang of this.getAllAvailableLanguages()) {
      const content = this.getSmartContent(lang);
      if (content && content.isTextFormat) {
        result.push(lang);
      }
    }

    return result;
  }

  /**
   * 尋找支援二進位格式的語言
   */
  public findBinaryLanguages(): SupportedLanguage[] {
    const result: SupportedLanguage[] = [];

    for (const lang of this.getAllAvailableLanguages()) {
      const content = this.getSmartContent(lang);
      if (content && content.isBinaryFormat) {
        result.push(lang);
      }
    }

    return result;
  }

  /**
   * 非同步轉換為內容
   * @param preferredLang 偏好語言
   * @param format 輸出格式
   * @param converters 內容轉換器
   */
  public async toContentAsync(
    preferredLang?: SupportedLanguage,
    format: "TEXT" | "HTML" | "MARKDOWN" = "TEXT",
    converters?: Record<string, unknown>
  ): Promise<string> {
    const sourceLang = this.findBestSourceLanguage(preferredLang);
    if (!sourceLang) return '';

    return await this.renderAsync(sourceLang, format, converters);
  }

  /**
   * 從檔案建立多國語言智慧內容
   */
  public static async fromFile(
    file: File,
    lang: SupportedLanguage = 'en'
  ): Promise<MultilingualSmartContent> {
    const smartContent = await SmartContent.fromFile(file);
    return new MultilingualSmartContent({
      [lang]: smartContent,
    });
  }

  /**
   * 從 JSON 建立實例
   */
  public static fromJSON(json: unknown): MultilingualSmartContent {
    if (typeof json !== 'object' || json === null) {
      return new MultilingualSmartContent();
    }

    const data: MultilingualData<SmartContent> = {};

    for (const [lang, contentData] of Object.entries(json as Record<string, unknown>)) {
      if (contentData && typeof contentData === 'object') {
        data[lang as SupportedLanguage] = SmartContent.fromJSON(contentData);
      }
    }

    return new MultilingualSmartContent(data);
  }

  /**
   * 複製實例
   */
  public override clone(): MultilingualSmartContent {
    const data: MultilingualData<SmartContent> = {};

    for (const lang of super.getAllAvailableLanguages()) {
      const content = this.getSmartContent(lang);
      if (content) {
        data[lang] = content.clone();
      }
    }

    return new MultilingualSmartContent(data);
  }
}
