import { loadSync } from "std/dotenv";

// 環境判斷：預設 dev，可透過 APP_ENV 設為 test / prod
const APP_ENV = Deno.env.get("APP_ENV") ?? "dev";

// 只有在非 prod 才載入檔案型環境變數，prod 交由外部（如 Docker）提供
if (APP_ENV !== "prod") {
  const envFile = APP_ENV === "test" ? ".env.test" : ".env.local";

  // 若 .env.local 不存在，再回退到 .env
  const files = APP_ENV === "test" ? [envFile] : [envFile, ".env"];

  for (const file of files) {
    try {
      const map = loadSync({ envPath: file, export: true });
      // 如果成功載入，直接結束，不再繼續回退
      if (Object.keys(map).length > 0) break;
    } catch (_) {
      // 檔案不存在時忽略
      continue;
    }
  }
}

// 將 APP_ENV 也放回環境供後續使用（例如日誌、判斷邏輯）
Deno.env.set("APP_ENV", APP_ENV);
