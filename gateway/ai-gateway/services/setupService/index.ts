// 系統安裝服務 — 首次執行設定 API
import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { dataPool } from "@dui/database";
import 管理員 from "../../database/models/管理員.ts";
import { info } from "../../utils/logger.ts";

// ── 安裝 API ──
export function 建立安裝Router(): Hono {
  const router = new Hono();

  // 提交安裝設定
  router.post("/api/v1/setup", async (c) => {
    try {
      const body = await c.req.json();

      // 更新管理員
      const 管理員結果 = await dataPool.list<管理員>("管理員", 100, 0);
      const 現有管理員 = (管理員結果.data ?? [])[0];
      const 雜湊 = await bcrypt.hash(body.admin密碼, 10);
      await dataPool.upsert("管理員", {
        id: 現有管理員?.id ?? "管理員:管理員:admin",
        帳號: body.admin帳號 ?? "admin",
        密碼雜湊: 雜湊,
        角色: "superadmin",
      });

      // 更新系統設定
      await dataPool.upsert("系統設定", {
        id: "系統設定:系統設定:default",
        L2資料庫類型: body.L2資料庫類型 ?? "",
        L2主機: body.L2主機 ?? "",
        L2端口: body.L2端口 ?? 0,
        L2資料庫名稱: body.L2資料庫名稱 ?? "",
        L2使用者: body.L2使用者 ?? "",
        L2密碼: body.L2密碼 ?? "",
        伺服器端口: body.伺服器端口 ?? 8000,
        日誌等級: body.日誌等級 ?? "info",
        外部排程器URL: body.外部排程器URL ?? "",
      });

      await info("Setup", "系統安裝完成，請重新啟動伺服器");
      return c.json({ success: true });
    } catch (err) {
      return c.json({ success: false, error: `安裝失敗: ${(err as Error).message}` }, 500);
    }
  });

  return router;
}
