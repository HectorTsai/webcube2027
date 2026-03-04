import { 開啟KV, 取得資料 } from "@/database/kv.ts";
import 系統資訊 from "@/database/models/系統資訊.ts";
import { SurrealDB } from "@/database/surrealdb.ts";

interface MiddlewareContext {
  request: Request;
  path: string;
  method: string;
  url: URL;
  headers: Headers;
  query: Record<string, string>;
  cookies: {
    get: (name: string) => string | undefined;
    set: (name: string, value: string) => void;
    remove: (name: string) => void;
    getAll: () => Record<string, string>;
  };
  state: Record<string, unknown>;
}

// 型別提示：此檔在執行環境有 Deno，全域 Theme 用於佈景主題。
declare const Deno: {
  readTextFile: (path: string) => Promise<string>;
  env?: { get: (key: string) => string | undefined };
};
type Theme = Record<string, unknown>;

const kvPromise = 開啟KV();

export default async function middleware(req: MiddlewareContext) {
  console.log("Middleware called for path:", req.path);
  // 讀取系統資訊並放入 state，後續 middleware/layout 可取得
  try {
    const kv = await kvPromise;
    const systemInfo = await 取得資料(kv, "系統資訊:系統資訊:預設");
    if (systemInfo) req.state.系統資訊 = systemInfo;
  } catch (_) {
    console.log("[_middleware.ts] 讀取系統資訊失敗!");
    // 若 KV 讀取失敗，略過，不阻斷請求
  }

  // 若已配置 DB，檢查密碼
  const systemInfo = req.state.系統資訊 as 系統資訊;
  if (systemInfo?.資料庫 && typeof systemInfo.資料庫.CipherText === 'string' && systemInfo.資料庫.CipherText !== "") {
    const secret = Deno.env?.get("SECRET_PASSWORD");
    if (!secret) return new Response("未設定密碼", { status: 404 });
  }

  // 檢查系統資訊是否有 DB 資料，若無重定向到設定頁面
  if (!systemInfo?.資料庫 || typeof systemInfo.資料庫.CipherText !== 'string' || systemInfo.資料庫.CipherText === "") {
    // 允許訪問設定頁面和靜態資源
    if (req.path !== "/setup" && !req.path.startsWith("/api") && !req.path.startsWith("/assets")) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/setup" },
      });
    }
  } else {
    // 嘗試連線 SurrealDB：從系統資訊讀取設定
    try {
      const surreal = new SurrealDB({
        url: await systemInfo.資料庫.getPlainText(),
        user: systemInfo.使用者 ?? "",
        password: await systemInfo.密碼.getPlainText(),
        namespace: systemInfo.命名空間 ?? "webcube",
        database: systemInfo.資料庫名稱 ?? "webcube",
      });
      await surreal.signin();
      await surreal.ensureSeed();
      req.state.系統資料庫 = surreal;
    } catch (_err) {
      return new Response("資料庫連線失敗", { status: 404 });
    }
  }

  // 載入主題
  try {
    const colors = JSON.parse(
      await Deno.readTextFile("database/seeds/配色.json"),
    );
    const skeletons = JSON.parse(
      await Deno.readTextFile("database/seeds/骨架.json"),
    );
    const colorScheme = colors[0];
    const skeleton = skeletons[0];
    const theme = {
      主色: colorScheme.主色,
      次色: colorScheme.次色,
      強調色: colorScheme.強調色,
      中性色: colorScheme.中性色,
      背景1: colorScheme.背景1,
      背景2: colorScheme.背景2,
      背景3: colorScheme.背景3,
      背景內容: colorScheme.背景內容,
      資訊色: colorScheme.資訊色,
      成功色: colorScheme.成功色,
      警告色: colorScheme.警告色,
      錯誤色: colorScheme.錯誤色,
      圓角: skeleton.圓角,
    };
    (globalThis as { currentTheme?: Theme }).currentTheme = theme;
  } catch (e) {
    console.log("Theme load error:", e);
  }

  // 檢查授權標頭
  const token = req.headers.get("authorization");

  // 如果沒有 token 且訪問管理頁面，重新導向到登入頁面
  if (!token && req.path.startsWith("/admin")) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login",
      },
    });
  }

  // 繼續處理請求 (不返回值)
}
