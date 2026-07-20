// System 頁面認證 Middleware — 套用於 /system/* 頁面路由
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";

const 系統認證中間件: MiddlewareHandler = async (c, next) => {
  // 優先檢查 cookie 中的 JWT
  const token = getCookie(c, "jwt");

  if (!token) {
    return c.redirect("/login");
  }

  try {
    const 金鑰 = Deno.env.get("SECRET_KEY") ?? "";
    await verify(token, 金鑰, "HS256");
    await next();
  } catch {
    return c.redirect("/login");
  }
};

export default 系統認證中間件;
