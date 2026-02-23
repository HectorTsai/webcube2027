import { 從ext取得格式, 支援的格式, 格式對應表 } from "./file.ts";
/**
 * 智慧內容類別 - 負責處理單一內容的不同格式轉換
 */
export default class 智慧內容 {
  private _format: 支援的格式 = "TEXT";
  private _content: string | Uint8Array = "";
  private _isProcessed: boolean = false;

  /**
   * 建立智慧內容實例
   * @param data 可選的初始資料
   */
  public constructor(data?: { 格式: 支援的格式; 內容: string | Uint8Array }) {
    if (data && data.格式) {
      if (Object.keys(格式對應表).includes(data.格式)) {
        this._format = data.格式;
        this._content = data.內容 ?? "";
      }
    }
  }

  /**
   * 非同步載入和處理內容
   */
  public async fetchAsync(): Promise<void> {
    if (this._isProcessed) return;
    if (typeof this._content === "string" && this.isURL(this._content)) {
      const url = this._content;
      console.log(`[智慧內容] 檢測到 URL 內容，開始載入: ${url}`);
      try {
        const remoteContent = await this.從遠程載入內容(url);
        this._content = remoteContent.內容;
        this._format = remoteContent.格式;
        this._isProcessed = true;
        console.log(
          `[智慧內容] 成功載入 URL 內容: ${url} 格式:${this._format}`,
        );
      } catch (error) {
        console.error(`[智慧內容] 載入 URL 內容失敗: ${url}`, error);
        // 無法載入內容，保持原狀
        this._isProcessed = true;
      }
      return;
    }

    // 處理字串內容
    if (typeof this._content === "string") {
      this._format = this.推斷文字格式(this._content);
      this._isProcessed = true;
      return;
    }

    // 處理二進位內容
    if (this._content instanceof Uint8Array) {
      this._format = this.推斷二進位格式(this._content);
      this._isProcessed = true;
      return;
    }

    // 其他類型轉換為字串
    // 無法載入內容，保持原狀
    console.warn(
      `[智慧內容] 不支援的內容類型 ${this._content}，轉換為字串處理`,
    );
    this._isProcessed = true;
  }

  /**
   * 檢查字串是否為 URL
   */
  private isURL(str: string): boolean {
    return str.startsWith("http://") ||
      str.startsWith("https://") ||
      str.startsWith("file://") ||
      str.startsWith("data:");
  }

  /**
   * 從遠程資源載入內容
   */
  private async 從遠程載入內容(
    url: string,
  ): Promise<{ 格式: 支援的格式; 內容: string | Uint8Array }> {
    try {
      let content: string | Uint8Array;
      let detectedFormat: 支援的格式 = this._format;

      if (typeof Deno !== "undefined") {
        const resourceHandler = await import("./資源處理器.ts");
        const resource = resourceHandler.default;

        console.log(`[智慧內容] 正在載入資源: ${url}`);
        const data = await resource.smartFetch(url);

        if (data instanceof Uint8Array) {
          console.log(
            `[智慧內容] 載入到二進位內容，長度: ${data.length} 位元組`,
          );
          content = data;
          detectedFormat = this.推斷二進位格式(data, url);
        } else if (typeof data === "string") {
          console.log(`[智慧內容] 載入到文字內容，長度: ${data.length} 字元`);
          content = data;
          detectedFormat = this.推斷文字格式(data, url);
        } else {
          console.log(`[智慧內容] 載入到 JSON 物件`);
          content = JSON.stringify(data);
          detectedFormat = "JSON";
        }
      } else {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(
            `[智慧內容] 使用 fetch 載入資源失敗: ${response.status} ${response.statusText}`,
          );
          return { 格式: this._format, 內容: this._content };
        }

        const contentType = response.headers.get("content-type") || "";
        const isBinary =
          !(contentType.startsWith("text/") || contentType.includes("json") ||
            contentType.includes("xml"));

        if (isBinary) {
          content = new Uint8Array(await response.arrayBuffer());
          detectedFormat = this.推斷二進位格式(content, url);
        } else {
          content = await response.text();
          detectedFormat = this.推斷文字格式(content, url);
        }
      }

      return { 格式: detectedFormat, 內容: content };
    } catch (error) {
      console.error(`[智慧內容] 無法載入遠程資源 ${url}:`, error);
      return { 格式: this._format, 內容: this._content };
    }
  }

  /**
   * 根據檔案名稱或路徑取得格式資訊
   * @param fileOrUrl 檔案名稱或路徑
   * @returns 格式對應項目 {ext: 支援的格式, info: 檔案對應項目}，如果找不到則返回 undefined
   */
  private 取得格式項目(fileOrUrl: string) {
    const cleanPath = fileOrUrl.split("?")[0].split("#")[0];
    const ext = cleanPath.split(".").pop()?.toLowerCase();
    if (!ext) return undefined;
    return 從ext取得格式(ext);
  }

  /**
   * 從副檔名推斷格式
   */
  private 從副檔名推斷格式(filename: string): 支援的格式 {
    const entry = this.取得格式項目(filename);
    if (entry) return entry.ext;
    return "BINARY"; // 預設為二進位格式
  }

  /**
   * 推斷文字內容格式
   */
  private 推斷文字格式(content: string, url?: string): 支援的格式 {
    if (url) {
      const entry = this.取得格式項目(url);
      if (entry && entry.info.type === "text") return entry.ext;
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
  private 推斷二進位格式(content: Uint8Array, url?: string): 支援的格式 {
    // 從 URL 副檔名推斷
    if (url) {
      const entry = this.取得格式項目(url);
      if (entry && entry.info.type === "binary") return entry.ext;
    }
    // 從魔數推斷
    const binaryFormats = Object.entries(格式對應表)
      .filter(([_, info]) => info.type === "binary" && info.magicNumbers)
      .map(([format, info]) => ({
        format: format as 支援的格式,
        magicNumbers: info.magicNumbers!,
      }));

    // 檢查每種格式的魔數
    for (const { format, magicNumbers } of binaryFormats) {
      const allMatch = magicNumbers.every(({ offset, bytes }) => {
        if (offset + bytes.length > content.length) return false;
        return bytes.every((byte, i) => content[offset + i] === byte);
      });

      if (allMatch) return format;
    }

    // 默認為二進位
    return "BINARY";
  }

  /**
   * 獲取格式
   */
  public get 格式(): 支援的格式 {
    return this._format;
  }

  /**
   * 設置格式
   */
  public set 格式(format: 支援的格式) {
    this._format = format;
  }

  /**
   * 獲取內容
   */
  public get 內容(): string | Uint8Array {
    return this._content;
  }

  /**
   * 設置內容
   */
  public set 內容(content: string | Uint8Array) {
    this._content = content;
    this._isProcessed = false; // 內容變更後標記為未處理
  }

  /**
   * 檢查是否為文字格式
   */
  public get is文字格式(): boolean {
    const formatInfo = 格式對應表[this._format];
    return formatInfo?.type === "text";
  }

  /**
   * 檢查是否為二進位格式
   */
  public get is二進位格式(): boolean {
    const formatInfo = 格式對應表[this._format];
    return formatInfo?.type === "binary";
  }

  /**
   * 從 JSON 數據創建智慧內容
   */
  public static fromJSON(json: any): 智慧內容 {
    if (typeof json === "string") {
      try {
        const parsed = JSON.parse(json);
        return this.fromJSON(parsed);
      } catch {
        return new 智慧內容({ 格式: "TEXT", 內容: json });
      }
    }

    if (json && typeof json === "object" && "格式" in json && "內容" in json) {
      const format = json.格式 as 支援的格式;
      let content = json.內容;

      // 驗證格式是否存在
      if (!格式對應表[format]) {
        console.warn(
          `[智慧內容] fromJSON 中有不支援的格式: ${format}，使用預設格式 TEXT`,
        );
        return new 智慧內容({ 格式: "TEXT", 內容: String(content) });
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
          console.warn(`[智慧內容] 無法將內容轉換為二進位，使用原始字串`, e);
        }
      }

      return new 智慧內容({ 格式: format, 內容: content });
    }

    // 默認為文字內容
    return new 智慧內容({ 格式: "TEXT", 內容: String(json) });
  }
  /**
   * 從 Web Form 上傳的檔案創建智慧內容
   * @param file 使用者上傳的檔案
   * @param format 可選的格式，如果未指定則從副檔名推斷
   * @returns 包含智慧內容的 Promise
   */
  public static async fromFile(
    file: File,
    format?: 支援的格式,
  ): Promise<智慧內容> {
    // 從檔案副檔名推斷格式
    const detectedFormat = format || this.prototype.從副檔名推斷格式(file.name);
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
    const instance = new 智慧內容({
      格式: detectedFormat,
      內容: content,
    });

    // 標記為已處理，因為我們已經處理了檔案內容
    instance["_isProcessed"] = true;

    return instance;
  }
  /**
   * 複製智慧內容
   */
  public clone(): 智慧內容 {
    if (this._content instanceof Uint8Array) {
      return new 智慧內容({
        格式: this._format,
        內容: new Uint8Array(this._content),
      });
    } else {
      return new 智慧內容({ 格式: this._format, 內容: this._content });
    }
  }

  /**
   * 序列化為 JSON
   */
  public toJSON() {
    if (this._content instanceof Uint8Array) {
      // 二進位內容轉為 base64
      return {
        格式: this._format,
        內容: this._content.toBase64(),
      };
    } else {
      // 文字內容直接返回
      return {
        格式: this._format,
        內容: this._content,
      };
    }
  }

  /**
   * 轉換為字串表示
   */
  public toString(): string {
    if (this._content instanceof Uint8Array) {
      // 二進位內容直接返回 base64，避免 UTF-8 解碼問題
      return this._content.toBase64();
    } else {
      // 文字內容直接返回
      return this._content;
    }
  }
}
