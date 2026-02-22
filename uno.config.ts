import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
} from "unocss";

export default defineConfig({
  content: {
    filesystem: ["./**/*.{ts,tsx,js,jsx}"],
  },
  presets: [
    presetUno(), // 基礎預設支援 arbitrary values
    presetAttributify(), // 屬性化模式
    presetIcons({
      scale: 1.2,
      warn: true,
    }), // 圖標預設
  ],
});
