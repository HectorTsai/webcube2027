/**
 * Dev config
 * Override only; framework deep-merges with main.ts
 */
export default {
  server: {
    host: "127.0.0.1",
    port: 3000,
    dev: {
      hmr: { enabled: true, path: "/__hmr" },
      watch: {
        paths: ["./src"],
        ignore: ["node_modules", ".git", "dist"],
      },
    },
  },
  logger: {
    level: "debug",
    format: "text",
  },
  hotReload: true,
};
