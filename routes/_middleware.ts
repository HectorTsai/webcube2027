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
  state: Record<string, MiddlewareContext>;
}

// 型別提示：此檔在執行環境有 Deno，全域 Theme 用於佈景主題。
declare const Deno: { readTextFile: (path: string) => Promise<string> };
type Theme = Record<string, unknown>;

export default async function middleware(req: MiddlewareContext) {
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
