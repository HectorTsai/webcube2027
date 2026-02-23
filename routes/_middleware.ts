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

export default function middleware(req: MiddlewareContext) {
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
