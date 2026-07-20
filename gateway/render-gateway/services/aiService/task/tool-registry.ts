// /services/aiService/task/tool-registry.ts — 工具註冊中心（初始化）
//
// 職責：
//   將 6 個子 generator（配色/骨架/風格/動畫/裝飾/圖示集）註冊為 AI 可調用的工具。
//   ThemeGenerator 在初始化時呼叫 初始化工具(c)，之後 ToolRegistry.list() 即可包含所有工具。
//
// 擴充方式：
//   新增第七金剛時，只需在此檔案 import 並新增對應的 register 呼叫，
//   ThemeGenerator 完全不需改動。

import { Context } from 'hono';
import { ToolRegistry } from '../../../utils/AIToolRegistry.ts';
import { ColorGenerator } from './color-generator.ts';
import { SkeletonGenerator } from './skeleton-generator.ts';
import { StyleGenerator } from './style-generator.ts';
import { AnimateGenerator } from './animate-generator.ts';
import { OrnamentGenerator } from './ornament-generator.ts';
import { IconSetGenerator } from './icon-set-generator.ts';

/**
 * 初始化所有工具（ThemeGenerator 在生成/調整前呼叫一次）
 * 
 * 每個工具需要 Context 來建立對應的 generator 實例。
 * 註冊後，AI 可以透過 function calling 調用這些工具。
 */
export function 初始化工具(c: Context): void {
  // 避免重複註冊
  if (ToolRegistry.數量 > 0) return;

  // ── 1. 配色生成器 ──
  ToolRegistry.register({
    名稱: 'generate_color',
    描述: '根據描述生成全新的配色方案（OKLCH 格式，含 9 個色值：主色/次色/強調色/中性色/背景/資訊/成功/警告/錯誤）。當既有配色清單中沒有符合租戶需求的配色時，調用此工具。',
    參數: {
      描述: { type: 'string', description: '配色需求描述，例如「深咖啡色系，色相角 45-60，比目前更暗 15%」' },
    },
    必填: ['描述'],
    執行: async (args) => {
      const gen = new ColorGenerator(c);
      const result = await gen.生成配色(args.描述 as string);
      return {
        工具名稱: 'generate_color',
        成功: true,
        資料: { 配色ID: result.配色Data.名稱, 對話ID: result.對話ID },
      };
    },
  });

  // ── 2. 骨架生成器 ──
  ToolRegistry.register({
    名稱: 'generate_skeleton',
    描述: '根據描述生成全新的骨架配置（CSS Token：radius/spacing/font/leading/border/icon/image 七大族系）。當既有骨架清單中沒有符合需求的骨架時，調用此工具。',
    參數: {
      描述: { type: 'string', description: '骨架需求描述，例如「寬鬆間距、大圓角的舒適佈局」' },
    },
    必填: ['描述'],
    執行: async (args) => {
      const gen = new SkeletonGenerator(c);
      const result = await gen.生成骨架(args.描述 as string);
      return {
        工具名稱: 'generate_skeleton',
        成功: true,
        資料: { 骨架ID: result.骨架Data.名稱, 對話ID: result.對話ID },
      };
    },
  });

  // ── 3. 風格生成器 ──
  ToolRegistry.register({
    名稱: 'generate_style',
    描述: '根據描述生成全新的風格配置（CSS 變數組合：gradient/pattern/border/shadow/text-color 等）。當既有風格清單中沒有符合需求的風格時，調用此工具。',
    參數: {
      描述: { type: 'string', description: '風格需求描述，例如「溫暖柔和的陰影、外框線風格」' },
    },
    必填: ['描述'],
    執行: async (args) => {
      const gen = new StyleGenerator(c);
      const result = await gen.生成風格(args.描述 as string);
      return {
        工具名稱: 'generate_style',
        成功: true,
        資料: { 風格ID: result.風格Data.名稱, 對話ID: result.對話ID },
      };
    },
  });

  // ── 4. 動畫生成器 ──
  ToolRegistry.register({
    名稱: 'generate_animate',
    描述: '根據描述生成全新的動畫配置（17 個動畫場景的 Animate.css class 映射）。當既有動畫清單中沒有符合需求的動畫方案時，調用此工具。',
    參數: {
      描述: { type: 'string', description: '動畫需求描述，例如「輕柔淡入、滑順過渡」' },
    },
    必填: ['描述'],
    執行: async (args) => {
      const gen = new AnimateGenerator(c);
      const result = await gen.生成動畫(args.描述 as string);
      return {
        工具名稱: 'generate_animate',
        成功: true,
        資料: { 動畫ID: result.動畫Data.名稱, 對話ID: result.對話ID },
      };
    },
  });

  // ── 5. 裝飾生成器 ──
  ToolRegistry.register({
    名稱: 'generate_ornament',
    描述: '根據描述生成全新的裝飾配置（8 個裝飾位置的 SVG 引用：角落/浮水印/徽章等）。當既有裝飾清單中沒有符合需求的裝飾方案時，調用此工具。',
    參數: {
      描述: { type: 'string', description: '裝飾需求描述，例如「咖啡豆主題的角落圖案」' },
    },
    必填: ['描述'],
    執行: async (args) => {
      const gen = new OrnamentGenerator(c);
      const result = await gen.生成裝飾(args.描述 as string);
      return {
        工具名稱: 'generate_ornament',
        成功: true,
        資料: { 裝飾ID: result.裝飾Data.名稱, 對話ID: result.對話ID },
      };
    },
  });

  // ── 6. 圖示集生成器 ──
  ToolRegistry.register({
    名稱: 'generate_icon_set',
    描述: '根據描述生成全新的圖示集配置（14 個標準語義鍵位 → 圖示 ID 對照表）。圖示 ID 必須從既有圖示庫中選取。當既有圖示集清單中沒有符合需求的圖示組合時，調用此工具。',
    參數: {
      描述: { type: 'string', description: '圖示集需求描述，例如「極簡細線條風格、搭配咖啡廳主題」' },
    },
    必填: ['描述'],
    執行: async (args) => {
      const gen = new IconSetGenerator(c);
      const result = await gen.生成圖示集(args.描述 as string);
      return {
        工具名稱: 'generate_icon_set',
        成功: true,
        資料: { 圖示集ID: result.圖示集Data.名稱, 對話ID: result.對話ID },
      };
    },
  });
}
