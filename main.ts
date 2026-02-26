import "./type.ts";
import { App } from "@dreamer/dweb";
import { staticPlugin } from "@dreamer/plugins/static";
import { unocssPlugin } from "@dreamer/plugins/unocss";
import { openKV, getValue, setValue } from "./database/kv.ts";
import 系統資訊 from "./database/models/系統資訊.ts";
import { SmartContent } from "@dui/smartmultilingual";

// 初始化 KV 並種入預設系統資訊
const kv = await openKV();
const existing = await getValue(kv, "system");
if (!existing) {
  const seed = new 系統資訊({
    名稱: { "zh-tw": "Webcube", en: "Webcube" },
    描述: {
      "zh-tw": new SmartContent({ format: "MARKDOWN", content: "" }),
    },
    商標: "",
    橫幅: "",
    預設語言: "zh-tw",
    資料庫: { type: "KV", url: "" },
    版權資料: { 公司: { "zh-tw": "Webcube" }, 網址: "", 開始年份: 2025 },
  });
  await setValue(kv, "system", seed.toJSON());
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
