// pipelines/rbacPipeline.ts — 角色權限控制管線 (RBAC)
// 職責：根據目前登入使用者的角色，決定是否熔斷（隱藏）特定方塊。
// 目前階段：全 Pass 擋板，留作未來精細化局部方塊隱藏使用。
import type { Context } from "hono";

/**
 * 角色權限控制管線
 * 插入位置：Wave 1 第二棒（chainPipeline 之後、apiPipeline 之前）
 * 目前全透明放行，不改變任何 pipeline 狀態
 */
export async function rbacPipeline(
  definition: any,
  args: any,
  _context: Context | undefined, // ⏳ 保留供未來讀取 context.get("user") 使用
): Promise<{ definition: any; args: any }> {
  // 🎯 未來的邏輯預留區：
  // const user = context.get("user"); // 取得目前登入者
  // if (definition.roles && !definition.roles.includes(user.role)) {
  //   // 🛡️ 徹底熔斷：返回 __melted 安全標記物件，清空 args 防止敏感資料洩漏，
  //   //    方塊.tsx 會檢測此標記並直接 return ""，避免後續管線 TypeError
  //   return { definition: { ...definition, __melted: true, tag: null }, args: {} };
  // }

  // 目前：直接原樣放行
  return { definition, args };
}
