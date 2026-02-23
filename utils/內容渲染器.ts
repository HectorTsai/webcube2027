import { render as gfmRender } from "@deno/gfm";
import 智慧內容, { 支援的格式 } from "./智慧內容.ts";
import { 格式對應表 } from "./file.ts";

/**
 * 內容渲染器 - 負責各種格式的內容渲染
 */
export class 內容渲染器 {
  /**
   * 渲染 Markdown 為 HTML
   */
  public static 渲染Markdown(
    markdown: string,
    converters: Record<string, any> = {},
  ): string {
    if (!markdown) return "";

    // 處理轉換器（將 [key] 替換為實際值）
    let processedMarkdown = markdown;
    for (const [key, value] of Object.entries(converters)) {
      const regex = new RegExp(`\\[${key}\\]`, "g");
      processedMarkdown = processedMarkdown.replace(regex, String(value));
    }

    return gfmRender(processedMarkdown);
  }

  /**
   * 渲染智慧內容
   */
  public static async 渲染(
    content: 智慧內容,
    format: "TEXT" | "HTML" | "MARKDOWN" = "TEXT",
    converters: Record<string, any> = {},
  ): Promise<string> {
    await content.fetchAsync();
    const rawContent = content.內容;
    const contentType = content.格式;

    switch (format) {
      case "HTML":
        return this.渲染為HTML(contentType, rawContent, converters);
      case "MARKDOWN":
        return this.渲染為Markdown(contentType, rawContent, converters);
      case "TEXT":
      default:
        return this.渲染為文字(contentType, rawContent);
    }
  }

  private static 渲染為HTML(
    format: 支援的格式,
    content: string | Uint8Array,
    converters: Record<string, any> = {},
  ): string {
    if (format === "MARKDOWN" || format === "TEXT") {
      const markdown = this.渲染為Markdown(format, content, converters);
      return this.渲染Markdown(markdown, converters);
    }
    return this.渲染二進位為HTML(format, content);
  }

  private static 渲染為Markdown(
    format: 支援的格式,
    content: string | Uint8Array,
    converters: Record<string, any> = {},
  ): string {
    if (typeof content !== "string") {
      return "";
    }

    let markdown = content;
    // 處理轉換器
    for (const [key, value] of Object.entries(converters)) {
      const regex = new RegExp(`\\[${key}\\]`, "g");
      markdown = markdown.replace(regex, String(value));
    }
    return markdown;
  }

  private static 渲染為文字(
    format: 支援的格式,
    content: string | Uint8Array,
  ): string {
    return typeof content === "string" ? content : "";
  }

  private static 渲染二進位為HTML(
    format: 支援的格式,
    content: string | Uint8Array,
  ): string {
    const mimeType = 格式對應表[format]?.mime || "application/octet-stream";
    const base64 = typeof content === "string"
      ? content.startsWith("data:") ? content.split(",")[1] : btoa(content)
      : btoa(String.fromCharCode(...new Uint8Array(content)));

    return `<img src="data:${mimeType};base64,${base64}" alt="${format} content" />`;
  }
}
