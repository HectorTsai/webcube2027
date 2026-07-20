import { getFormatFromExt, 格式對應表 } from '../../utils/file/formats.ts';
import type { SupportedFormat, FileMappingItem } from '../../utils/file/formats.ts';

/**
 * 智慧內容類別 - 負責處理單一內容的不同格式轉換
 * 支援自動載入遠程資源和格式推斷
 */
export class SmartContent {
  private _format: SupportedFormat = "TEXT";
  private _content: string | Uint8Array = "";
  private _isProcessed: boolean = false;

  /**
   * 建立智慧內容實例
   * @param data 可選的初始資料
   */
  public constructor(data?: { format: SupportedFormat; content: string | Uint8Array }) {
    if (data && data.format) {
      if (Object.keys(格式對應表).includes(data.format)) {
        this._format = data.format;
        this._content = data.content ?? "";
      }
    }
  }

  /**
   * 非同步載入和處理內容
   */
  public async fetchAsync(): Promise<void> {
    if (this._isProcessed) return;

    // 處理 URL 內容
    if (typeof this._content === "string" && this.isURL(this._content)) {
      const url = this._content;
      console.log(`[SmartContent] 檢測到 URL 內容，開始載入: ${url}`);

      try {
        const remoteContent = await this.fetchRemoteContent(url);
        this._content = remoteContent.content;
        this._format = remoteContent.format;
        this._isProcessed = true;
        console.log(`[SmartContent] 成功載入 URL 內容: ${url} 格式:${this._format}`);
      } catch (error) {
        console.error(`[SmartContent] 載入 URL 內容失敗: ${url}`, error);
        // 無法載入內容，保持原狀
        this._isProcessed = true;
      }
      return;
    }

    // 處理字串內容
    if (typeof this._content === "string") {
      this._format = this.inferTextFormat(this._content);
      this._isProcessed = true;
      return;
    }

    // 處理二進位內容
    if (this._content instanceof Uint8Array) {
      this._format = this.inferBinaryFormat(this._content);
      this._isProcessed = true;
      return;
    }

    // 其他類型轉換為字串
    console.warn(`[SmartContent] 不支援的內容類型 ${this._content}，轉換為字串處理`);
    this._isProcessed = true;
  }

  /**
   * 檢查字串是否為 URL
   */
  private isURL(str: string): boolean {
    return str.startsWith("http://") ||
      str.startsWith("https://") ||
      str.startsWith("file://") ||
      str.startsWith("ftp://") ||
      str.startsWith("data:");
  }

  /**
   * 從遠程資源載入內容
   */
  private async fetchRemoteContent(
    url: string,
  ): Promise<{ format: SupportedFormat; content: string | Uint8Array }> {
    try {
      let content: string | Uint8Array;
      let detectedFormat: SupportedFormat = this._format;

      // 優先使用 fetch API（適用於瀏覽器和 Deno）
      const response = await fetch(url);
      if (!response.ok) {
        console.error(
          `[SmartContent] 使用 fetch 載入資源失敗: ${response.status} ${response.statusText}`,
        );
        return { format: this._format, content: this._content };
      }

      const contentType = response.headers.get("content-type") || "";
      const isBinary =
        !(contentType.startsWith("text/") || contentType.includes("json") ||
          contentType.includes("xml"));

      if (isBinary) {
        content = new Uint8Array(await response.arrayBuffer());
        detectedFormat = this.inferBinaryFormat(content, url);
      } else {
        content = await response.text();
        detectedFormat = this.inferTextFormat(content, url);
      }

      return { format: detectedFormat, content };
    } catch (error) {
      console.error(`[SmartContent] 無法載入遠程資源 ${url}:`, error);
      return { format: this._format, content: this._content };
    }
  }

  /**
   * 從副檔名推斷格式
   */
  private inferFormatFromExtension(filename: string): SupportedFormat {
    const cleanPath = filename.split("?")[0].split("#")[0];
    const ext = cleanPath.split(".").pop()?.toLowerCase();
    if (!ext) return "BINARY";

    const entry = getFormatFromExt(ext);
    return entry ? entry.ext : "BINARY";
  }

  /**
   * 推斷文字內容格式
   */
  private inferTextFormat(content: string, url?: string): SupportedFormat {
    // 從 URL 副檔名推斷
    if (url) {
      const entry = this.inferFormatFromExtension(url);
      const formatInfo = 格式對應表[entry];
      if (formatInfo && formatInfo.type === "text") return entry;
    }

    const trimmed = content.trim();

    // SVG 檢查
    if (trimmed.startsWith("<svg") && trimmed.includes("</svg>")) {
      return "SVG";
    }

    // JSON 檢查
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === "object" && parsed !== null) {
        return "JSON";
      }
    } catch { /* 不是 JSON */ }

    // Markdown 檢查
    const markdownPatterns = [
      /^#{1,6}\s+/m, // 標題
      /^\*\s+/m, // 無序列表
      /^\d+\.\s+/m, // 有序列表
      /\*\*.*?\*\*/, // 粗體
      /\*.*?\*/, // 斜體
      /\[.*?\]\(.*?\)/, // 鏈接
      /```[\s\S]*?```/, // 代碼塊
      /^> /m, // 引用
      /\|.*\|/, // 表格
      /^---+$/m, // 分隔線
    ];

    if (markdownPatterns.some((pattern) => pattern.test(content))) {
      return "MARKDOWN";
    }

    // 默認為文字
    return "TEXT";
  }

  /**
   * 推斷二進位內容格式
   */
  private inferBinaryFormat(content: Uint8Array, url?: string): SupportedFormat {
    // 從 URL 副檔名推斷
    if (url) {
      const entry = this.inferFormatFromExtension(url);
      const formatInfo = 格式對應表[entry];
      if (formatInfo && formatInfo.type === "binary") return entry;
    }

    // 從魔數推斷
    const binaryFormats = Object.entries(格式對應表)
      .filter(([_, info]) => (info as FileMappingItem).type === "binary" && (info as FileMappingItem).magicNumbers)
      .map(([format, info]) => ({
        format: format as SupportedFormat,
        magicNumbers: (info as FileMappingItem).magicNumbers!,
      }));

    // 檢查每種格式的魔數
    for (const { format, magicNumbers } of binaryFormats) {
      const allMatch = magicNumbers.every(({ offset, bytes }: { offset: number; bytes: readonly number[] }) => {
        if (offset + bytes.length > content.length) return false;
        return bytes.every((byte: number, i: number) => content[offset + i] === byte);
      });

      if (allMatch) return format;
    }

    // 默認為二進位
    return "BINARY";
  }

  /**
   * 獲取格式
   */
  public get format(): SupportedFormat {
    return this._format;
  }

  /**
   * 設置格式
   */
  public set format(format: SupportedFormat) {
    this._format = format;
  }

  /**
   * 獲取內容
   */
  public get content(): string | Uint8Array {
    return this._content;
  }

  /**
   * 設置內容
   */
  public set content(content: string | Uint8Array) {
    this._content = content;
    this._isProcessed = false; // 內容變更後標記為未處理
  }

  /**
   * 檢查是否為文字格式
   */
  public get isTextFormat(): boolean {
    const formatInfo = 格式對應表[this._format];
    return formatInfo?.type === "text";
  }

  /**
   * 檢查是否為二進位格式
   */
  public get isBinaryFormat(): boolean {
    const formatInfo = 格式對應表[this._format];
    return formatInfo?.type === "binary";
  }

  /**
   * 從 JSON 數據創建智慧內容
   */
  public static fromJSON(json: unknown): SmartContent {
    if (typeof json === "string") {
      try {
        const parsed = JSON.parse(json);
        return this.fromJSON(parsed);
      } catch {
        return new SmartContent({ format: "TEXT", content: json });
      }
    }

    if (json && typeof json === "object" && "format" in json && "content" in json) {
      const data = json as { format: SupportedFormat; content: unknown };
      const format = data.format;
      let content = data.content;

      // 驗證格式是否存在
      if (!格式對應表[format]) {
        console.warn(
          `[SmartContent] fromJSON 中有不支援的格式: ${format}，使用預設格式 TEXT`,
        );
        return new SmartContent({ format: "TEXT", content: String(content) });
      }

      // 檢查格式類型並處理內容
      const formatInfo = 格式對應表[format];
      if (formatInfo?.type === "binary" && typeof content === "string") {
        // 二進位格式且內容是字串，轉換為 Uint8Array
        try {
          const binaryString = atob(content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          content = bytes;
        } catch (e) {
          console.warn(`[SmartContent] 無法將內容轉換為二進位，使用原始字串`, e);
        }
      }

      return new SmartContent({ format, content: content as string | Uint8Array });
    }

    // 默認為文字內容
    return new SmartContent({ format: "TEXT", content: String(json) });
  }

  /**
   * 從檔案建立智慧內容
   */
  public static async fromFile(
    file: File,
    format?: SupportedFormat,
  ): Promise<SmartContent> {
    // 從檔案副檔名推斷格式
    const detectedFormat = format || this.prototype.inferFormatFromExtension(file.name);
    const formatInfo = 格式對應表[detectedFormat];

    // 讀取檔案內容
    const arrayBuffer = await file.arrayBuffer();
    let content: string | Uint8Array;

    if (formatInfo.type === "text") {
      // 文字格式，解碼為字串
      const decoder = new TextDecoder();
      content = decoder.decode(new Uint8Array(arrayBuffer));
    } else {
      // 二進位格式，保持為 Uint8Array
      content = new Uint8Array(arrayBuffer);
    }

    // 建立智慧內容實例
    const instance = new SmartContent({
      format: detectedFormat,
      content,
    });

    // 標記為已處理，因為我們已經處理了檔案內容
    Reflect.set(instance, "_isProcessed", true);

    return instance;
  }

  /**
   * 複製智慧內容
   */
  public clone(): SmartContent {
    if (this._content instanceof Uint8Array) {
      return new SmartContent({
        format: this._format,
        content: new Uint8Array(this._content),
      });
    } else {
      return new SmartContent({ format: this._format, content: this._content });
    }
  }

  /**
   * 序列化為 JSON
   */
  public toJSON(): { format: SupportedFormat; content: string } {
    if (this._content instanceof Uint8Array) {
      // 二進位內容轉為 base64
      return {
        format: this._format,
        content: this.toBase64(),
      };
    } else {
      // 文字內容直接返回
      return {
        format: this._format,
        content: this._content,
      };
    }
  }

  /**
   * 轉換為字串表示
   */
  public toString(): string {
    if (this._content instanceof Uint8Array) {
      // 二進位內容直接返回 base64，避免 UTF-8 解碼問題
      return this.toBase64();
    } else {
      // 文字內容直接返回
      return this._content;
    }
  }

  /**
   * 轉換為 Base64
   */
  private toBase64(): string {
    if (this._content instanceof Uint8Array) {
      // 使用更安全的方式轉換大型 Uint8Array 為 base64
      const chunkSize = 0x8000; // 32KB chunks
      const chunks: string[] = [];

      for (let i = 0; i < this._content.length; i += chunkSize) {
        const chunk = Array.from(this._content.subarray(i, i + chunkSize));
        chunks.push(String.fromCharCode(...chunk));
      }
      return btoa(chunks.join(""));
    }
    return "";
  }
}
