import "./env.ts";
import { App } from "@dreamer/dweb";
import { staticPlugin } from "@dreamer/plugins/static";
import { unocssPlugin } from "@dreamer/plugins/unocss";
import { 開啟KV, 取得資料, 寫入資料 } from "./database/kv.ts";
import 系統資訊 from "./database/models/系統資訊.ts";
import { 讀取種子 } from "./database/index.ts";

// 初始化 KV 並從 seeds 注入預設系統資訊（若不存在）
const kv = await 開啟KV();
const existing = await 取得資料(kv, "系統資訊:系統資訊:預設");
if (!existing) {
  const seeds = await 讀取種子<系統資訊>("系統資訊");
  const seed = seeds?.[0];
  if (seed) {
    seed.資料庫 = Deno.env.get("DB_URL") ?? seed.資料庫 ?? "";
    await 寫入資料(kv, seed);
  }
}

const app = new App();

app.registerPlugin(unocssPlugin({
  output: "dist/client/assets",
  cssEntry: "assets/uno.css",
  config: "./uno.config.ts",
  content: ["./**/*.{ts,tsx}"],
}));

app.registerPlugin(staticPlugin({
  statics: [
    { root: "assets", prefix: "/assets" },
    { root: "dist/client/assets", prefix: "/assets" },
  ],
}));

app.start();
