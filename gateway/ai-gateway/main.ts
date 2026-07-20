import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";
import { 處理AI請求 } from "./services/aiService/index.ts";
import { 定時器 } from "./services/scheduler/index.ts";
import { 設定App, InnerAPI } from "./services/index.ts";
import { dataPool, registerModel } from "@dui/database";
import { info } from "./utils/logger.ts";
import AI伺服器 from "./database/models/AI伺服器.ts";
import 排程記錄 from "./database/models/排程記錄.ts";
import 系統設定 from "./database/models/系統設定.ts";
import 管理員 from "./database/models/管理員.ts";
import { 建立AuthRouter, 管理員驗證 } from "./services/authService/index.ts";
import { 建立安裝Router } from "./services/setupService/index.ts";
import { 掃描頁面, 掃描中間件 } from "./utils/頁面路由.tsx";
import { verify } from "hono/jwt";
import bcrypt from "bcryptjs";

const app = new Hono();

// ── 註冊資料庫 Model ──
registerModel("AI伺服器", AI伺服器);
registerModel("排程記錄", 排程記錄);
registerModel("系統設定", 系統設定);
registerModel("管理員", 管理員);

// ── 注入 app 實例給 InnerAPI ──
設定App(app);

// 靜態檔案服務
app.use(
  "/static/*",
  serveStatic({
    root: ".",
    getContent: async (path: string) => {
      try {
        return await Deno.readTextFile(path);
      } catch {
        return undefined;
      }
    },
  }),
);

// ── 安裝狀態（啟動時設定，middleware 讀取） ──
let 已初始化 = false;
let 加密金鑰_SECRET = "";

// ── 安裝檢查 Middleware ──
app.use("*", async (c, next) => {
  const 是安裝路徑 = c.req.path === "/setup" || c.req.path === "/api/v1/setup";

  if (!已初始化 && !是安裝路徑) return c.redirect("/setup");
  if (已初始化 && 是安裝路徑) return c.redirect("/");

  await next();
});

// ── 系統管理路由驗證 Middleware ──
app.use("/api/v1/system/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return c.redirect("/");

  try {
    await verify(authHeader.slice(7), 加密金鑰_SECRET, "HS256");
    await next();
  } catch {
    return c.redirect("/");
  }
});

// ── 註冊 pages/ 下的 middleware.ts ──
const 中間件列表 = await 掃描中間件(`${import.meta.dirname}/pages`);
for (const { pattern, handler } of 中間件列表) {
  app.use(pattern, handler);
}

// 掃描 pages/ 目錄，註冊頁面路由
const 頁面路由 = await 掃描頁面(`${import.meta.dirname}/pages`);
app.route("/", 頁面路由);

// 安裝路由（永遠掛載，由 middleware 決定可否存取）
const installRouter = 建立安裝Router();
app.route("/", installRouter);

// API 路由
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Pool 路由
app.all("/api/v1/ai/*", async (c) => {
  return 處理AI請求(c);
});

// ── 啟動 ──
async function main() {
  // 初始化 L1 資料庫（自動載入 seeds/ 目錄下的種子資料）
  await dataPool.initL1();

  // 讀取系統設定
  const 設定結果 = await dataPool.list<系統設定>("系統設定", 1, 0);
  const 設定 = (設定結果.data ?? [])[0];

  // 確保加密金鑰（兩種模式都需要）
  let 加密金鑰 = 設定?.加密金鑰 ?? "";
  if (!加密金鑰) {
    加密金鑰 = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await dataPool.upsert("系統設定", {
      id: "系統設定:系統設定:default",
      加密金鑰,
    });
    await info("Main", "已自動生成加密金鑰並存入資料庫");
  }
  Deno.env.set("SECRET_KEY", 加密金鑰);
  加密金鑰_SECRET = 加密金鑰;

  // 判斷是否已初始化
  已初始化 = !!設定?.L2資料庫類型;

  if (!已初始化) {
    // ── 未安裝模式 ──
    await info("Main", "尚未安裝，請前往 /setup 進行設定");
    Deno.serve({ port: 8000 }, app.fetch);
    return;
  }

  // ── 已安裝模式 ──
  await info("Main", "系統已初始化，完整啟動");

  // 掛載認證路由
  const authRouter = 建立AuthRouter(加密金鑰);
  app.route("/api/v1/auth", authRouter);

  // 確保預設管理員存在
  const 管理員結果 = await dataPool.list<管理員>("管理員", 100, 0);
  if ((管理員結果.data ?? []).length === 0) {
    const 預設密碼 = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("").slice(0, 16);
    const 雜湊 = await bcrypt.hash(預設密碼, 10);
    await dataPool.upsert("管理員", {
      id: "管理員:管理員:admin",
      帳號: "admin",
      密碼雜湊: 雜湊,
      角色: "superadmin",
    });
    await info("Main", `已建立預設管理員「admin」，密碼: ${預設密碼}（請立即修改）`);
  }

  // 啟動排程器
  const 外部排程器URL = 設定?.外部排程器URL ?? "";
  if (外部排程器URL) {
    await info("Main", `使用外部排程器: ${外部排程器URL}`);
  } else {
    await info("Main", "啟動內建排程器");
    await 定時器.排程({
      讀取所有排程: async () => {
        const result = await dataPool.listAll<排程記錄>("排程記錄");
        return (result.data ?? []).map((d) => new 排程記錄(d));
      },
      更新最後執行: async (id: string, time: Date) => {
        await dataPool.upsert("排程記錄", { id, 最後執行: time });
      },
      刪除排程: async (id: string) => {
        await dataPool.delete(id);
      },
    });
  }

  Deno.serve({ port: 8000 }, app.fetch);
}

await main();
