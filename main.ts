import "./type.ts";

import { getDatabase, initDatabase } from "@dreamer/database";

await initDatabase("system", {
  adapter: "sqlite",
  connection: { filename: "data/system.db" },
});
const systemDb = getDatabase("system");

import { 內建資料庫, 所有資料庫 } from "./database.ts";
內建資料庫 = systemDb;
所有資料庫["webcube"] = 內建資料庫;

/**
 * Server entry
 * View + @dreamer/dweb
 * Config is auto-loaded by framework, no manual import needed
 */

import { App } from "@dreamer/dweb";
import { staticPlugin } from "@dreamer/plugins/static";
import { unocssPlugin } from "@dreamer/plugins/unocss";

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
