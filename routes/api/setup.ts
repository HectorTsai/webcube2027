import { 開啟KV, 取得資料, 寫入資料 } from "@/database/kv.ts";
import 系統資訊 from "@/database/models/系統資訊.ts";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const dbUrl = formData.get("dbUrl") as string;
    const dbUser = formData.get("dbUser") as string;
    const dbPassword = formData.get("dbPassword") as string;
    const dbNamespace = formData.get("dbNamespace") as string;
    const dbDatabase = formData.get("dbDatabase") as string;

    if (!dbUrl || !dbPassword) {
      return new Response("Missing required fields", { status: 400 });
    }

    const kv = await 開啟KV();
    let systemInfo = await 取得資料(kv, "系統資訊:系統資訊:預設");

    if (!systemInfo) {
      // 如果沒有，創建預設
      systemInfo = new 系統資訊();
    }

    // 更新 DB 資訊
    await systemInfo.資料庫.setPlainText(dbUrl);
    systemInfo.使用者 = dbUser || "";
    await systemInfo.密碼.setPlainText(dbPassword);
    systemInfo.命名空間 = dbNamespace || "webcube";
    systemInfo.資料庫名稱 = dbDatabase || "webcube";

    await 寫入資料(kv, systemInfo);

    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
