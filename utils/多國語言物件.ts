export const 所有語言 = [
  "af",
  "sq",
  "am",
  "ar",
  "hy",
  "az",
  "eu",
  "be",
  "bn",
  "bs",
  "bg",
  "ca",
  "ceb",
  "ny",
  "zh-cn",
  "zh-tw",
  "zh",
  "co",
  "hr",
  "cs",
  "da",
  "nl",
  "en",
  "eo",
  "et",
  "tl",
  "fi",
  "fr",
  "fy",
  "gl",
  "ka",
  "de",
  "el",
  "gu",
  "ht",
  "ha",
  "haw",
  "he",
  "iw",
  "hi",
  "hmn",
  "hu",
  "is",
  "ig",
  "id",
  "ga",
  "it",
  "ja",
  "jw",
  "kn",
  "kk",
  "km",
  "ko",
  "ku",
  "ky",
  "lo",
  "la",
  "lv",
  "lt",
  "lb",
  "mk",
  "mg",
  "ms",
  "ml",
  "mt",
  "mi",
  "mr",
  "mn",
  "my",
  "ne",
  "no",
  "ps",
  "fa",
  "pl",
  "pt",
  "pa",
  "ro",
  "ru",
  "sm",
  "gd",
  "sr",
  "st",
  "sn",
  "sd",
  "si",
  "sk",
  "sl",
  "so",
  "es",
  "su",
  "sw",
  "sv",
  "tg",
  "ta",
  "te",
  "th",
  "tr",
  "uk",
  "ur",
  "uz",
  "vi",
  "cy",
  "xh",
  "yi",
  "yo",
  "zu",
] as const;

export const 所有語言集合 = new Set(所有語言);
export type 支援的語言 = (typeof 所有語言)[number];

/**
 * 多國語言資料結構
 */
export type 多國語言資料<T> = Record<string, T>;

/**
 * 改進版多國語言字串類別
 * 直接繼承物件來支援直覺的 index access
 * @template T 必須實作 可JSON序列化 介面的類型
 */
// 定義索引簽名介面
interface 多國語言索引<T> {
  [key: string]: T | undefined;
}

export default class 多國語言物件<T> implements 多國語言索引<T> {
  // 使用 private 存儲實際數據，使用底線前綴表示私有屬性

  // 實現索引簽名
  [key: string]: any;

  protected constructor(data?: 多國語言資料<T>) {
    // 初始化支援的語言
    if (data) {
      for (const [lang, value] of Object.entries(data)) {
        if (所有語言集合.has(lang as 支援的語言)) {
          this[lang as 支援的語言] = value;
          this[lang] = value;
        }
      }
    }
  }

  /** 檢查是否有指定語言的文字 */
  public has(lang: 支援的語言): boolean {
    return !!this[lang];
  }

  public delete(lang: 支援的語言): boolean {
    const hasKey = !!this[lang];
    delete this[lang];
    return hasKey;
  }

  /** 取得所有可用的語言 */
  public 所有可用的語言(): 支援的語言[] {
    return Object.keys(this).filter(
      (key) => 所有語言集合.has(key as 支援的語言),
    ) as 支援的語言[];
  }

  /** 取得第一個可用的語言 */
  public 第一個可用的語言(): 支援的語言 | null {
    const available = this.所有可用的語言();
    return available.length > 0 ? available[0] : null;
  }

  /** 尋找最佳的來源語言 */
  public 尋找最佳的來源語言(preferredLang?: 支援的語言): 支援的語言 | null {
    // 優先順序：指定語言 > 英文 > 第一個可用語言
    if (preferredLang && this.has(preferredLang)) return preferredLang;
    if (this.has("en")) return "en";
    if (this.has("zh-tw")) return "zh-tw";
    return this.第一個可用的語言();
  }

  protected async 翻譯(
    host: string | undefined,
    from: 支援的語言,
    to: 支援的語言,
    text: string,
  ) {
    try {
      let result = text;
      if (typeof Deno !== "undefined") {
        const module = await import("../service/翻譯.ts");
        const 翻譯 = module.default;
        result = await 翻譯(host ?? "", from, to, text);
      } else {
        const url = encodeURI(
          `/api/語言/翻譯?from=${from}&to=${to}&text=${text}`,
        );
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          result = data.translated;
        }
      }
      return result;
    } catch (e) {
      console.error(`[多國語言物件]翻譯失敗 ${from} -> ${to}: ${text} => Fail`);
      console.log(e);
      return text;
    }
  }
  /**
   * 轉換為純物件
   * @param 語言集 - 指定要轉換的語言集合，如果未指定則轉換所有支援的語言
   * @returns 純物件，包含指定語言的多國語言資料的 JSON 表示
   */
  public toJSON(語言集?: 支援的語言[]): 多國語言資料<any> {
    const result: 多國語言資料<any> = {} as 多國語言資料<any>;
    // 只返回支援的語言
    for (const lang of (語言集 || this.所有可用的語言())) {
      const data = this[lang];
      /*
            if (data) result[lang] = data;
                const value = typeof (data as any)?.toJSON === 'function' ? (data as any).toJSON() : data;
                console.log(`toJSON ${data}: ${value}`);
                if (value !== '') result[lang] = value;
            }*/
      if (data) result[lang] = data;
    }
    return result;
  }

  /**
   * 轉換為字串表示
   * @returns JSON 字串表示
   * 注意：如果 T 不是字串，務必override 這個，以免變 {}
   */
  public toString(): string {
    return JSON.stringify(this.toJSON());
  }

  /** 複製實例 */
  public clone(): 多國語言物件<T> {
    return new 多國語言物件(this.toJSON());
  }

  /** 合併其他多國語言字串 */
  public static merge = <T>(
    ...objects: Array<多國語言物件<T>>
  ): 多國語言物件<T> => {
    const merged = new 多國語言物件<T>();
    for (const obj of objects) {
      for (const lang of obj.所有可用的語言()) {
        merged[lang] = obj[lang]; // 直接使用属性访问
      }
    }
    return merged;
  };

  /**
   * 檢查對象是否為多國語言物件實例
   */
  public static is<T>(obj: any): obj is 多國語言物件<T> {
    return obj instanceof 多國語言物件;
  }
}

// 全域註冊（保持相容性）
if (typeof globalThis !== "undefined") {
  (globalThis as any).所有語言 = 所有語言;
}
