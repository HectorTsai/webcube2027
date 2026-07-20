// 檔案路由 — 自動掃描 /pages 目錄
//   - .tsx  → 頁面元件，註冊為 GET 路由
//   - middleware.ts → 中間件，依目錄層級套用
import { Hono, type Context, type MiddlewareHandler } from "hono";
import type { FC } from "hono/jsx";

// ── 頁面 ──

interface 頁面條目 {
  routePath: string;
  component: FC;
}

/**
 * 掃描 pagesDir 下的所有 .tsx 檔案（不含 Layout.tsx），
 * 根據目錄結構自動映射為路由路徑。
 *
 * 映射規則：
 *   /pages/index.tsx           → GET /
 *   /pages/login.tsx           → GET /login
 *   /pages/setup.tsx           → GET /setup
 *   /pages/system/dashboard.tsx → GET /system/dashboard
 */
export async function 掃描頁面(pagesDir: string): Promise<Hono> {
  const router = new Hono();
  const 條目列表: 頁面條目[] = [];

  await 掃描目錄(pagesDir, pagesDir, 條目列表);

  for (const { routePath, component: Component } of 條目列表) {
    router.get(routePath, (c: Context) => c.html(<Component />));
  }

  return router;
}

async function 掃描目錄(
  baseDir: string,
  currentDir: string,
  results: 頁面條目[],
) {
  for await (const entry of Deno.readDir(currentDir)) {
    const fullPath = `${currentDir}/${entry.name}`;

    if (entry.isDirectory) {
      await 掃描目錄(baseDir, fullPath, results);
    } else if (entry.name.endsWith(".tsx") && entry.name !== "Layout.tsx") {
      const relativePath = fullPath.slice(baseDir.length + 1);
      const filePath = relativePath.replace(/\.tsx$/, "");
      const routePath = filePath === "index" ? "/" : `/${filePath}`;

      const module = await import(fullPath);
      if (module.default) {
        results.push({
          routePath,
          component: module.default,
        });
      }
    }
  }
}

// ── 中間件 ──

export interface 中間件定義 {
  /** app.use 的路徑樣式，如 "*" 或 "/system/*" */
  pattern: string;
  handler: MiddlewareHandler;
}

/**
 * 掃描 pagesDir 下所有的 middleware.ts 檔案，
 * 根據所處目錄層級回傳 { pattern, handler } 陣列。
 *
 * 映射規則：
 *   /pages/middleware.ts       → pattern: "*"
 *   /pages/system/middleware.ts → pattern: "/system/*"
 */
export async function 掃描中間件(pagesDir: string): Promise<中間件定義[]> {
  const entries: 中間件定義[] = [];

  async function walk(dir: string, routePrefix: string) {
    // 檢查當前目錄是否有 middleware.ts
    const middlewarePath = `${dir}/middleware.ts`;
    try {
      const stat = await Deno.stat(middlewarePath);
      if (stat.isFile) {
        const module = await import(middlewarePath);
        if (module.default) {
          const pattern = routePrefix ? `${routePrefix}/*` : "*";
          entries.push({ pattern, handler: module.default });
        }
      }
    } catch {
      // 沒有 middleware.ts — 正常
    }

    // 遞迴子目錄
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isDirectory) {
        const subPrefix = routePrefix ? `${routePrefix}/${entry.name}` : `/${entry.name}`;
        await walk(`${dir}/${entry.name}`, subPrefix.replace(/^\//, ""));
      }
    }
  }

  await walk(pagesDir, "");
  return entries;
}
