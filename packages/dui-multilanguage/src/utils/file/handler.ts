import { extname } from "@std/path";
import { extract } from "@std/front-matter/any";
import { getFormatFromExt } from './formats.ts';

/**
 * 資源處理器類別
 * 負責載入和處理各種格式的資源檔案
 */
export class ResourceHandler {
  /**
   * 智慧載入資源的主要方法
   * 支援 HTTP URL、本地檔案路徑和純文字內容。
   * 若讀取失敗會根據副檔名回傳安全的預設值。
   * @param fileOrUrl 檔案路徑、URL 或純文字內容
   */
  static async smartFetch(fileOrUrl: string): Promise<unknown> {
    const isHttp = fileOrUrl.startsWith("http");
    const isFile = fileOrUrl.startsWith("file://");

    console.log(
      `[ResourceHandler] smartFetch: ${fileOrUrl} ${
        isHttp ? "HTTP" : isFile ? "File" : "Text"
      }`,
    );

    try {
      if (isHttp) {
        return await this.handleHttpResource(fileOrUrl);
      } else if (isFile) {
        return await this.handleFileProtocol(fileOrUrl);
      } else {
        return await this.handleLocalFile(fileOrUrl);
      }
    } catch (error) {
      console.error(`[ResourceHandler] 處理 ${fileOrUrl} 時發生錯誤:`, error);
      return await this.getDefaultValue(this.getExtension(fileOrUrl));
    }
  }

  /**
   * 處理 HTTP 資源，並依 content-type 或副檔名判定文字/二進位。
   */
  private static async handleHttpResource(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${url}`);
    }

    const _contentType = response.headers.get("content-type") || "";
    const ext = this.getExtension(url);
    const formatInfo = getFormatFromExt(ext);

    if (formatInfo?.info.type === "binary") {
      return new Uint8Array(await response.arrayBuffer());
    } else {
      let text = await response.text();

      // 處理 Markdown front matter
      if (ext === "md" && typeof text === "string") {
        text = this.parseMarkdown(text, url);
      }

      // 處理 JSON
      if (ext === "json" && typeof text === "string") {
        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn(`[ResourceHandler] 無法解析 JSON ${url}:`, e);
          return text;
        }
      }

      return text;
    }
  }

  /**
   * 處理 file:// 協議，轉為本機路徑後重用本地檔案邏輯。
   */
  private static async handleFileProtocol(fileUrl: string): Promise<unknown> {
    const filePath = fileUrl.replace("file://", "");
    return await this.handleLocalFile(filePath);
  }

  /**
   * 處理本地檔案，會依副檔名判斷文字/二進位，Markdown 解析 front matter，JSON 嘗試解析。
   */
  private static async handleLocalFile(filePath: string): Promise<unknown> {
    const ext = this.getExtension(filePath);
    const formatInfo = getFormatFromExt(ext);

    if (!formatInfo) {
      console.warn(`[ResourceHandler] 不支援的檔案類型: ${ext}`);
      return await this.getDefaultValue(ext);
    }

    try {
      const content = formatInfo.info.type === "binary"
        ? await Deno.readFile(filePath)
        : await Deno.readTextFile(filePath);

      if (ext === "md" && typeof content === "string") {
        return this.parseMarkdown(content, filePath);
      }

      if (ext === "json" && typeof content === "string") {
        try {
          return JSON.parse(content);
        } catch (e) {
          console.warn(`[ResourceHandler] 無法解析 JSON ${filePath}:`, e);
          return content;
        }
      }

      return content;
    } catch (error) {
      console.error(`[ResourceHandler] 讀取檔案失敗: ${filePath}`, error);
      return await this.getDefaultValue(ext);
    }
  }

  /**
   * 解析 Markdown 內容，處理 front matter。
   */
  private static parseMarkdown(content: string, file: string): string {
    try {
      const { body } = extract(content);
      return body;
    } catch (error) {
      console.warn(`[ResourceHandler] 解析 Markdown front matter 失敗 ${file}:`, error);
      return content;
    }
  }

  /**
   * 取得檔案副檔名（移除查詢與錨點，轉為小寫）。
   */
  private static getExtension(fileOrUrl: string): string {
    // 移除查詢參數和錨點
    const cleanPath = fileOrUrl.split("?")[0].split("#")[0];

    // 使用 Deno 內建的 extname 函數
    const extWithDot = extname(cleanPath);

    // 如果沒有副檔名，返回空字串
    if (!extWithDot) return "";

    // 移除 . 並轉為小寫
    const ext = extWithDot.slice(1).toLowerCase();

    // 驗證副檔名是否合理
    if (ext.length === 0 || ext.length > 10 || !/^[a-z0-9]+$/.test(ext)) {
      return "";
    }

    return ext;
  }

  /**
   * 取得預設值：二進位回傳空 Uint8Array，文字回傳空字串。
   */
  private static getDefaultValue(ext: string): unknown {
    // 根據格式類型返回適當的預設值
    const formatInfo = getFormatFromExt(ext);
    if (formatInfo?.info.type === "binary") {
      return new Uint8Array();
    }
    return "";
  }

  /**
   * 檢查檔案路徑安全性（基礎防路徑遍歷，並可限制允許目錄）。
   * 注意：這裡只做基本的檢查，依賴格式對應表提供主要的安全控制。
   */
  static validatePathSafety(
    filePath: string,
    allowedDirs: readonly string[],
  ): boolean {
    // 基本路徑清理
    const normalized = filePath.replace(/\\/g, "/");

    // 阻止明顯的路徑遍歷攻擊
    if (normalized.includes("../") || normalized.includes("..\\")) {
      return false;
    }

    // 如果提供了允許目錄，檢查是否在其中
    if (allowedDirs.length > 0) {
      const resolvedPath = normalized.startsWith("/")
        ? normalized
        : `/${normalized}`;

      return allowedDirs.some(dir => {
        const normalizedDir = dir.replace(/\\/g, "/").replace(/^\/+/, "/");
        return resolvedPath.startsWith(normalizedDir);
      });
    }

    // 如果沒有指定允許目錄，允許所有路徑（由格式對應表控制安全性）
    return true;
  }
}
