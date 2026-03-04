import { 開啟KV, 取得資料 } from "@/database/kv.ts";
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
  state: Record<string, any>;
}

// 型別提示：此檔在執行環境有 Deno，全域 Theme 用於佈景主題。
declare const Deno: {
  readTextFile: (path: string) => Promise<string>;
  env?: { get: (key: string) => string | undefined };
};
type Theme = Record<string, unknown>;

const kvPromise = 開啟KV();

export default async function middleware(req: MiddlewareContext) {
  const secret = Deno.env?.get("SECRET_PASSWORD");
  if (!secret) return new Response("未設定密碼", { status: 404 });

  // 讀取系統資訊並放入 state，後續 middleware/layout 可取得
  try {
    const kv = await kvPromise;
    const systemInfo = await 取得資料(kv, "系統資訊:系統資訊:預設");
    if (systemInfo) req.state.系統資訊 = systemInfo;
  } catch (_) {
    // 若 KV 讀取失敗，略過，不阻斷請求
  }

  // 嘗試連線 SurrealDB：DB_NAME 視為使用者帳號，namespace / database 可由環境設定（預設 webcube）
  const dbUrl = Deno.env?.get("DB_URL");
  const dbUser = Deno.env?.get("DB_NAME") ?? "";
  const dbPassword = Deno.env?.get("DB_PASSWORD") ?? "";
  const dbNamespace = Deno.env?.get("DB_NAMESPACE") ?? "webcube";
  const dbDatabase = Deno.env?.get("DB_DATABASE") ?? "webcube";
  if (dbUrl && dbPassword) {
    try {
      const surreal = new SurrealDB({
        url: dbUrl,
        user: dbUser,
        password: dbPassword,
        namespace: dbNamespace,
        database: dbDatabase,
      });
      await surreal.signin();
      await surreal.ensureSeed();
      req.state.系統資料庫 = surreal;
    } catch (_err) {
      return new Response("資料庫連線失敗", { status: 404 });
    }
  }

  // 載入主題
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
