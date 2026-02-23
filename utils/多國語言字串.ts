import type { 支援的語言 } from "./多國語言物件.ts";
import 多國語言物件, { 多國語言資料 } from "./多國語言物件.ts";

export default class 多國語言字串 extends 多國語言物件<string> {
  public constructor(data?: 多國語言資料<string>) {
    super(data);
  }

  public static async from(json: 多國語言資料<string>): Promise<多國語言字串> {
    const result = new 多國語言字串();
    for (const lang of 所有語言) {
      const content = json[lang];
      if (content) {
        if (
          content.startsWith("http://") || content.startsWith("https://") ||
          content.startsWith("file://")
        ) {
          if (Deno) {
            const resourceHandler = await import("./資源處理器.ts");
            const 資源處理器 = resourceHandler.default;
            const data = await 資源處理器.smartFetch(content);
            result[lang] = data;
          }
        } else result[lang] = content;
      }
    }
    return result;
  }

  public async toStringAsync(lang: 支援的語言, host?: string): Promise<string> {
    let result = this[lang];
    if (result) return result;
    const from = this.尋找最佳的來源語言(lang);
    if (!from) return "";
    let text = this[from];
    if (!text) return "";
    // 如果from[lang]是資源，則先取得資源
    try {
      if (
        text.startsWith("http://") || text.startsWith("https://") ||
        text.startsWith("file://")
      ) {
        if (typeof Deno !== "undefined") {
          const resourceHandler = await import("./資源處理器.ts");
          const 資源處理器 = resourceHandler.default;
          const data = await 資源處理器.smartFetch(text);
          this[from] = text = data;
        } else {
          const response = await fetch(text);
          if (response.ok) {
            this[from] = text = await response.text();
          }
        }
      }
    } catch (_e) {
      console.error(`[多國語言字串] 或許資源失敗 ${from} : ${text} => Fail`);
      return "";
    }
    // 翻譯
    result = await this.翻譯(host, from, lang, text);
    this[lang] = result;
    return result;
  }
}

// 確保全局註冊
if (typeof globalThis !== "undefined") {
  (globalThis as any).多國語言字串 = 多國語言字串;
}
