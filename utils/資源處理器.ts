import { extract } from "jsr:@std/front-matter";
import { dirname, extname, fromFileUrl, join } from "jsr:@std/path";

/**
 * 資源處理器類別 - 統一處理資源載入
 */
export default class 資源處理器 {
  private static _currentDir: string = dirname(fromFileUrl(import.meta.url));

  /**
   * 獲取資源的主要方法
   */
  static async smartFetch(fileOrUrl: string): Promise<any> {
    const isHttp = fileOrUrl.startsWith("http");
    const isFile = fileOrUrl.startsWith("file://");
    console.log(
      `[資源處理器] smartFetch: ${fileOrUrl} ${
        isHttp ? "HTTP" : isFile ? "File" : "Text"
      }`,
    );
    try {
      if (isHttp) return await this.處理Http資源(fileOrUrl);
      else if (isFile) return await this.處理File協議(fileOrUrl);
      else return fileOrUrl; // 純文字
      // 不再支援無協議的本地檔案讀取
    } catch (error) {
      console.error(`[資源處理器] 處理 ${fileOrUrl} 時發生錯誤:`, error);
      return "";
    }
  }

  /**
   * 使用 Deno 內建函數安全地取得副檔名
   * 處理各種情況：a.b.svg、網址參數、查詢字串等
   */
  public static 取得副檔名(fileOrUrl: string): string {
    // 移除查詢參數和錨點
    const cleanPath = fileOrUrl.split("?")[0].split("#")[0];

    // 使用 Deno 內建的 extname 函數取得副檔名（包含 .）
    const extWithDot = extname(cleanPath);

    // 如果沒有副檔名，返回空字串
    if (!extWithDot) return "";

    // 移除 . 並轉為小寫
    const ext = extWithDot.slice(1).toLowerCase();

    // 驗證副檔名是否合理（不包含特殊字元，長度合理）
    if (ext.length === 0 || ext.length > 10 || !/^[a-z0-9]+$/.test(ext)) {
      return "";
    }

    return ext;
  }

  /**
   * 處理 HTTP/HTTPS 資源
   */
  private static async 處理Http資源(url: string): Promise<any> {
    const ext = this.取得副檔名(url);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[資源處理器] HTTP 錯誤 ${response.status}: ${url}`);
        return await this.取得預設值(ext);
      }

      const 內容類型 = response.headers.get("content-type") || "";

      // 根據副檔名決定處理方式，但優先考慮 Content-Type
      let 內容: any;

      if (ext === "json") {
        // JSON 檔案：嘗試解析
        const text = await response.text();
        try {
          內容 = JSON.parse(text);
        } catch {
          內容 = text; // 解析失敗則返回原始文字
        }
      } else if (ext === "md") {
        // Markdown 檔案：作為文字處理
        內容 = await response.text();
        內容 = this.解析Markdown(內容, url);
      } else {
        // 其他檔案：根據 Content-Type 判斷
        const isText = 內容類型.startsWith("text/") ||
          內容類型.includes("json") || 內容類型.includes("xml");
        內容 = isText
          ? await response.text()
          : await response.arrayBuffer().then((buf) => new Uint8Array(buf));
      }

      return 內容;
    } catch (error) {
      console.error(`[資源處理器] HTTP 請求失敗: ${url}`, error);
      return await this.取得預設值(ext);
    }
  }

  /**
   * 處理 file:// 協議（包含安全檢查）
   */
  private static async 處理File協議(file: string): Promise<any> {
    const ext = this.取得副檔名(file);
    try {
      const 檔案路徑 = file.replace("file://", "");

      // 檢查副檔名是否支援
      const 檔案格式 = 從ext取得格式(ext);
      if (!檔案格式) {
        console.error(`[資源處理器] 不支援的檔案類型: ${ext}`);
        return await this.取得預設值(ext);
      }
      // 如果路徑中沒有目錄分隔符號，嘗試從格式對應的目錄中尋找
      if (!檔案路徑.includes("/") && !檔案路徑.includes("\\")) {
        for (const dir of 檔案格式.info.dir) {
          try {
            const 完整路徑 = join(Deno.cwd(), dir, 檔案路徑);
            const 內容 = 檔案格式.info.type === "binary"
              ? await Deno.readFile(完整路徑)
              : await Deno.readTextFile(完整路徑);
            if (ext === "md" && typeof 內容 === "string") {
              return this.解析Markdown(內容, file);
            }
            if (ext === "json" && typeof 內容 === "string") {
              return JSON.parse(內容);
            }
            return 內容;
          } catch (_e) {
            continue;
          }
        }
        return await this.取得預設值(ext);
      }
      // 如果路徑中包含目錄，直接使用該路徑
      const 完整路徑 = join(Deno.cwd(), 檔案路徑);
      if (!this.檢查檔案路徑安全性(完整路徑, 檔案格式.info.dir)) {
        console.error(`[資源處理器] 檔案路徑不在指定的路徑下: ${完整路徑}`);
        return await this.取得預設值(ext);
      }
      const 內容 = 檔案格式.info.type === "binary"
        ? await Deno.readFile(完整路徑)
        : await Deno.readTextFile(完整路徑);

      if (ext === "md" && typeof 內容 === "string") {
        return this.解析Markdown(內容, file);
      }
      if (ext === "json" && typeof 內容 === "string") return JSON.parse(內容);
      return 內容;
    } catch (error) {
      console.error(`[資源處理器] 讀取檔案失敗: ${file}`, error);
      return await this.取得預設值(ext);
    }
  }

  /**
   * 檢查檔案路徑安全性
   */
  private static 檢查檔案路徑安全性(
    檔案路徑: string,
    允許的目錄: readonly string[],
  ): boolean {
    // 將路徑轉換為統一格式
    const 標準化路徑 = 檔案路徑.replace(/\\/g, "/");
    const 專案根目錄 = Deno.cwd().replace(/\\/g, "/");

    // 取得相對於專案根目錄的路徑
    let 相對路徑 = 標準化路徑;
    if (標準化路徑.startsWith(專案根目錄)) {
      相對路徑 = 標準化路徑.substring(專案根目錄.length).replace(/^\/+/, "");
    }

    // 檢查是否包含危險的路徑元件
    if (
      相對路徑.includes("/..") || 相對路徑.includes("/~") ||
      相對路徑.startsWith("..") || 相對路徑.startsWith("~")
    ) {
      return false;
    }

    // 檢查是否在允許的目錄下
    for (const 目錄 of 允許的目錄) {
      const 標準化目錄 = 目錄.replace(/\/\.?$/, ""); // 移除結尾的斜線
      if (
        相對路徑 === 標準化目錄 ||
        相對路徑.startsWith(標準化目錄 + "/")
      ) {
        return true;
      }
    }

    // 輸出除錯資訊
    console.log(`[除錯] 路徑檢查失敗:`, {
      檔案路徑,
      標準化路徑,
      專案根目錄,
      相對路徑,
      允許的目錄,
    });

    return false;
  }

  /**
   * 根據ext取得預設值
   */
  private static async 取得預設值(ext: string): Promise<any> {
    const fallbackSvg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;
    switch (ext) {
      case "svg":
        try {
          const targetPath = join(this._currentDir, "..", "images", "cube.svg");
          return await Deno.readTextFile(targetPath);
        } catch {
          return fallbackSvg;
        }
      case "json":
        return {};
      case "md":
        return {
          attrs: {
            標題: "文件載入失敗",
            日期: new Date().toISOString(),
          },
          body: "# 文件載入失敗\n\n無法載入請求的文件內容。",
        };
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "webp":
      case "ico":
        return new Uint8Array([
          0x89,
          0x50,
          0x4E,
          0x47,
          0x0D,
          0x0A,
          0x1A,
          0x0A,
          0x00,
          0x00,
          0x00,
          0x0D,
          0x49,
          0x48,
          0x44,
          0x52,
          0x00,
          0x00,
          0x00,
          0x01,
          0x00,
          0x00,
          0x00,
          0x01,
          0x08,
          0x06,
          0x00,
          0x00,
          0x00,
          0x1F,
          0x15,
          0xC4,
          0x89,
          0x00,
          0x00,
          0x00,
          0x0A,
          0x49,
          0x44,
          0x41,
          0x54,
          0x78,
          0xDA,
          0x63,
          0x00,
          0x01,
          0x00,
          0x00,
          0x05,
          0x00,
          0x01,
          0x0D,
          0x0A,
          0x2D,
          0xB4,
          0x00,
          0x00,
          0x00,
          0x00,
          0x49,
          0x45,
          0x4E,
          0x44,
          0xAE,
          0x42,
          0x60,
          0x82,
        ]);
      default:
        return "";
    }
  }

  // 解析 Markdown 文件的 front-matter
  private static 解析Markdown(內容: string, 來源: string): any {
    try {
      const { body } = extract(內容);
      return body;
    } catch {
      // 當沒有 Front Matter 時，直接返回原始內容
      return 內容;
    }
  }
  static async fileExists(
    fileOrUrl: string,
    subPath: string = "images",
  ): Promise<boolean> {
    if (fileOrUrl.startsWith("http")) {
      try {
        const response = await fetch(fileOrUrl, { method: "HEAD" });
        return response.ok;
      } catch {
        return false;
      }
    }

    try {
      const fileName = fileOrUrl.split("/").pop() || "";
      const targetPath = join(
        this._currentDir,
        "..",
        "library",
        subPath,
        fileName,
      );
      const stats = await Deno.stat(targetPath);
      return stats.isFile;
    } catch {
      return false;
    }
  }

  static async ensureDir(path: string): Promise<boolean> {
    try {
      const absPath = path.startsWith("/") ? path : join(Deno.cwd(), path);
      await Deno.mkdir(absPath, { recursive: true });
      return true;
    } catch (err) {
      return err instanceof Deno.errors.AlreadyExists;
    }
  }

  static getDir(fullPath: string): string {
    const parts = fullPath.split(/[\\/]/);
    parts.pop();
    return parts.join("/") || ".";
  }

  static async removeFile(filePath: string): Promise<boolean> {
    try {
      await Deno.remove(filePath);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return true;
      }
      console.error(`[資源處理器] 刪除檔案失敗: ${filePath}`, error);
      return false;
    }
  }

  static async importType(typeName: string, subPath?: string): Promise<any> {
    const typeModules = import.meta.glob("../**/*.ts");
    try {
      const folderPart = subPath ? `${subPath.replace(/^\/|\/$/g, "")}/` : "";
      const targetKey = `../${folderPart}${typeName}.ts`;
      if (targetKey in typeModules) {
        const module: any = await typeModules[targetKey]();
        return module.default;
      }
      console.log(`[資源處理器] 找不到型別 ${typeName}:`, targetKey);
    } catch (err) {
      console.warn(`[資源處理器] 無法匯入型別: ${typeName}`, err);
    }
    return null;
  }

  private static async requestNetwork(
    url: string,
    type: "text" | "json" | "binary" | "check" = "text",
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(url, {
        method: type === "check" ? "HEAD" : "GET",
        signal: controller.signal,
        cache: "no-cache",
      });
      clearTimeout(timeoutId);

      if (type === "check") return response.ok;
      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") || "";
      const isBinary = !(contentType.startsWith("text/") ||
        contentType.includes("json") ||
        contentType.includes("xml"));

      if (type === "binary" || isBinary) {
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
      }

      const text = await response.text();
      return type === "json" ? JSON.parse(text) : text;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[資源處理器] 網路請求失敗: ${url}`, error);
      return null;
    }
  }
}
