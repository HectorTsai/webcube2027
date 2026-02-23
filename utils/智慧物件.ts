import 多國語言物件, { 多國語言資料 } from "./多國語言物件.ts";
import 智慧內容 from "./智慧內容.ts";
import { 支援的格式 } from "./file.ts";
import { 內容渲染器 } from "./內容渲染器.ts";

/**
 * 智慧物件類別 - 用於處理多種格式的智慧內容，支援多國語言
 */
export default class 智慧物件 extends 多國語言物件<智慧內容> {
  /**
   * 創建智慧物件
   * @param data 可選的初始資料
   */
  public constructor(
    data?: 多國語言資料<
      智慧內容 | { 格式: 支援的格式; 內容: string | Uint8Array }
    >,
  ) {
    super();
    if (data) {
      for (const [lang, content] of Object.entries(data)) {
        if (content instanceof 智慧內容) this[lang as 支援的語言] = content;
        else if (content && typeof content === "object" && "格式" in content) {
          this[lang as 支援的語言] = new 智慧內容({
            格式: content.格式,
            內容: content.內容,
          });
        }
      }
    }
  }

  /**
   * 從多國語言資料創建智慧物件
   */
  public static async from(
    data: 多國語言資料<{ 格式: 支援的格式; 內容: string | Uint8Array }>,
  ): Promise<智慧物件> {
    const result = new 智慧物件();
    const promises: Promise<void>[] = [];

    for (const lang of 所有語言) {
      const contentData = data[lang];
      if (contentData) {
        // 創建智慧內容實例並非同步處理
        const content = new 智慧內容({
          格式: contentData.格式,
          內容: contentData.內容,
        });

        // 非同步處理內容
        promises.push(
          content.fetchAsync().then(() => {
            result[lang] = content;
          }),
        );
      }
    }

    await Promise.all(promises);
    return result;
  }
  /**
   * 從檔案創建智慧物件
   */
  public static async fromFile(
    lang: 支援的語言,
    file: File,
    format?: 支援的格式,
  ): Promise<智慧物件> {
    const result = new 智慧物件();
    const content = await 智慧內容.fromFile(file, format);
    result[lang] = content;
    return result;
  }
  /**
   * 非同步取得所有語言的內容
   * 如果內容是遠程資源，則會自動下載
   */
  public async fetchAsync(): Promise<void> {
    const promises: Promise<void>[] = [];

    // 遍歷所有支援的語言
    for (const lang of 所有語言) {
      const content = this[lang];
      if (content && typeof content.fetchAsync === "function") {
        // 如果內容有 fetchAsync 方法，則調用
        promises.push(
          content.fetchAsync().catch((error: any) => {
            console.error(`[智慧物件] 獲取 ${lang} 內容失敗:`, error);
          }),
        );
      }
    }

    // 等待所有內容加載完成
    await Promise.all(promises);
  }
  /**
   * 渲染內容為指定語言的格式
   * @param lang 目標語言，預設為 'zh-tw'
   * @param host 主機位址，用於翻譯
   * @param converters 轉換器，用於替換內容中的標記
   * @returns 渲染後的字串
   */
  public async renderAsync(
    lang: 支援的語言 = "zh-tw",
    host: string = "",
    converters: Record<string, any> = {},
  ): Promise<string> {
    const 內容 = await this.toContentAsync(lang, host, converters);
    if (!內容) return "";

    // 使用內容的格式進行渲染
    return 內容渲染器.渲染(內容, "HTML", converters);
  }
  /**
   * 轉換為指定語言的內容
   * @param lang 目標語言
   * @param host 主機位址，用於翻譯
   */
  public async toContentAsync(
    lang: 支援的語言,
    host: string = "",
    converters: Record<string, any> = {},
  ): Promise<智慧內容 | null> {
    // 直接檢查目標語言是否存在
    let content: 智慧內容 | null = this[lang] as 智慧內容 | null;
    if (content) {
      await content.fetchAsync();
      return content;
    }

    // 使用現有方法尋找最佳來源語言
    const sourceLang = this.尋找最佳的來源語言();
    if (!sourceLang) return null;

    content = this[sourceLang];
    if (!content) return null;

    try {
      await content.fetchAsync();
      if (content.is二進位格式) return content;

      const sourceContent = content.內容 as string;

      // 處理標記（翻譯前）
      const processedText = this._processMarkers(sourceContent, converters);

      // 執行翻譯
      const translatedText = await this.翻譯(
        host,
        sourceLang,
        lang,
        processedText,
      );

      // 恢復標記（翻譯後）
      const finalContent = this._restoreMarkers(translatedText, converters);

      // 創建並保存翻譯結果
      const translatedContent = new 智慧內容({
        格式: content.格式,
        內容: finalContent,
      });

      this[lang] = translatedContent;
      return translatedContent;
    } catch (error) {
      console.error(`[智慧物件] 翻譯 ${sourceLang} 到 ${lang} 失敗:`, error);
      return content; // 返回源語言內容
    }
  }
  /**
   * 序列化為 JSON，使用智慧內容的 toJSON 方法
   */
  public override toJSON(語言集?: 支援的語言[]): 多國語言資料<any> {
    const result: 多國語言資料<any> = {} as 多國語言資料<any>;

    for (const lang of (語言集 || this.所有可用的語言())) {
      const content = this[lang];
      if (content !== undefined) { // 處理基本類型的序列化
        result[lang] = typeof (content as any)?.toJSON === "function"
          ? (content as any).toJSON()
          : content;
      }
    }
    return result;
  }
  /**
   * 從 JSON 反序列化，使用智慧內容的 fromJSON 方法
   */
  public static fromJSON(json: 多國語言資料<string>): 智慧物件 {
    const result = new 智慧物件();

    for (const lang of 所有語言) {
      const jsonString = json[lang];
      if (jsonString) {
        try {
          // 使用智慧內容的 fromJSON 方法
          const content = 智慧內容.fromJSON(jsonString);
          result[lang] = content;
        } catch (error) {
          console.error(`[智慧物件] 反序列化失敗 (${lang}):`, error);
          // 使用預設值
          result[lang] = new 智慧內容({ "格式": "TEXT", "內容": jsonString });
        }
      }
    }
    return result;
  }

  /**
   * 尋找包含指定格式的第一個語言
   */
  public 尋找格式語言(目標格式: 支援的格式): 支援的語言 | null {
    for (const lang of this.所有可用的語言()) {
      if (this[lang]?.格式 === 目標格式) {
        return lang;
      }
    }
    return null;
  }

  /**
   * 尋找第一個文字格式的語言
   */
  public 尋找文字語言(): 支援的語言 | null {
    for (const lang of this.所有可用的語言()) {
      const content = this[lang] as 智慧內容 | undefined;
      if (content?.is文字格式) return lang;
    }
    return null;
  }

  /**
   * 尋找第一個二進位格式的語言
   */
  public 尋找二進位語言(): 支援的語言 | null {
    for (const lang of this.所有可用的語言()) {
      const content = this[lang] as 智慧內容 | undefined;
      if (content?.is二進位格式) return lang;
    }
    return null;
  }
  /**
   * 處理標記轉換（用於翻譯前）
   * @param text 原始文字
   * @param converters 轉換器映射
   * @returns 處理後的文字
   */
  private _processMarkers(
    text: string,
    converters: Record<string, string>,
  ): string {
    let result = text;
    for (const [key, _value] of Object.entries(converters)) {
      // 將 [key] 替換為 key 的值
      result = result.replace(
        new RegExp(`\\[${key}\\]`, "g"),
        String(converters[key]),
      );
    }
    return result;
  }

  /**
   * 恢復標記（用於翻譯後）
   * @param text 處理後的文字
   * @param converters 臨時標記映射
   * @returns 恢復標記後的文字
   */
  private _restoreMarkers(
    text: string,
    converters: Record<string, string>,
  ): string {
    let result = text;
    function escapeRegExp(string: string): string {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    for (const [marker, original] of Object.entries(converters)) {
      result = result.replace(new RegExp(escapeRegExp(marker), "g"), original);
    }
    result = this._fixMarkdownFormatting(result);
    return result;
  }
  // 跳脫正則表達式中的特殊字符

  private _fixMarkdownFormatting(text: string): string {
    if (!text) return text;

    // 1. 先處理特殊情況：修復 "--- ###" 這種格式
    text = text.replace(/---\s*###/g, "---\n\n###");

    // 2. 確保 ** 和 # 前有換行（但不在行首時）
    text = text.replace(/([^\n])\s*([*#>]+)/g, "$1\n$2");

    // 3. 修正粗體格式（移除 ** 內的多餘空格）
    text = text.replace(/\*\*\s*([^*\n]+?)\s*\*\*/g, "**$1**");

    // 4. 修正標題格式（確保 # 後有空格）
    text = text.replace(/(^|\n)(#+)([^#\n][^\n]*)/g, (match, p1, p2, p3) => {
      const content = p3.trimStart();
      return `${p1}${p2} ${content}`;
    });

    // 5. 修復列表格式（確保列表項目前有 * 和空格）
    text = text.replace(/(^|\n)\s*([-*+])\s+/g, "$1$2 ");

    // 6. 修復區塊引用（確保 > 後有空格）
    text = text.replace(/(^|\n)\s*>\s*/g, "$1> ");

    // 7. 修復程式碼區塊
    text = text.replace(/```\s*(\w*)\s*([\s\S]*?)\s*```/g, "```$1\n$2\n```");

    // 8. 修復行內程式碼
    text = text.replace(/`\s*([^`\n]+?)\s*`/g, "`$1`");

    // 9. 修復連結和圖片
    text = text.replace(
      /\[\s*([^\]]+?)\s*\]\s*\(\s*([^)]+?)\s*\)/g,
      "[$1]($2)",
    );

    // 10. 移除多餘的空行（最多保留2個）
    text = text.replace(/\n{3,}/g, "\n\n");

    return text.trim() + "\n";
  }
}
