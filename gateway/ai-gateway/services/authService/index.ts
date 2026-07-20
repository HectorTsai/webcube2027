// 管理員認證服務 — JWT 登入 API + middleware
import { Hono, Context } from "hono";
import { sign, verify } from "hono/jwt";
import { setCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { dataPool } from "@dui/database";
import 管理員 from "../../database/models/管理員.ts";

const JWT_EXPIRES_S = 86400; // 24h

// ── JWT Payload 型別 ──
export interface JwtPayload {
  sub: string;
  帳號: string;
  角色: string;
  exp: number;
}

// ── 路由：登入 API ──
export function 建立AuthRouter(加密金鑰: string): Hono {
  const router = new Hono();

  // 登入 API
  router.post("/login", async (c) => {
    const { 帳號, 密碼 } = await c.req.json<{ 帳號: string; 密碼: string }>();

    const result = await dataPool.list<管理員>("管理員", 100, 0);
    const 管理員記錄 = (result.data ?? []).find((a) => a.帳號 === 帳號);
    if (!管理員記錄) {
      return c.json({ success: false, error: "帳號或密碼錯誤" }, 401);
    }

    const 驗證成功 = await bcrypt.compare(密碼, 管理員記錄.密碼雜湊);
    if (!驗證成功) {
      return c.json({ success: false, error: "帳號或密碼錯誤" }, 401);
    }

    const token = await sign(
      {
        sub: 管理員記錄.id,
        帳號: 管理員記錄.帳號,
        角色: 管理員記錄.角色,
        exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_S,
      },
      加密金鑰,
    );

    // 同時寫入 cookie（讓頁面路由 middleware 能驗證）
    setCookie(c, "jwt", token, {
      path: "/",
      httpOnly: true,
      secure: false, // 開發環境不用 HTTPS
      maxAge: JWT_EXPIRES_S,
      sameSite: "Lax",
    });

    return c.json({
      success: true,
      data: { token, 帳號: 管理員記錄.帳號, 角色: 管理員記錄.角色 },
    });
  });

  return router;
}

// ── JWT 驗證 Middleware（用於 API 路由） ──
export function 管理員驗證(加密金鑰: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ success: false, error: "未提供授權 token" }, 401);
    }

    try {
      const payload = await verify(authHeader.slice(7), 加密金鑰, "HS256") as unknown as JwtPayload;
      c.set("jwtPayload", payload);
      await next();
    } catch {
      return c.json({ success: false, error: "Token 無效或已過期" }, 401);
    }
  };
}
