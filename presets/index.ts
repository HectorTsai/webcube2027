import { definePreset } from "@unocss/core";
import { colorRules, DEFAULT_COLOR_THEME } from "./colors.ts";
import { skeletonRules, DEFAULT_SKELETON_THEME } from "./skeleton.ts";

export const presetWebCube = definePreset(() => {
  const color = DEFAULT_COLOR_THEME;
  const sk = DEFAULT_SKELETON_THEME;

  return {
    name: "webcube",
    preflights: [
      {
        getCSS: () => `
          :root {
            --p: oklch(${color.主色});
            --pc: oklch(from ${color.主色} calc(l + 0.3) c h);
            --s: oklch(${color.次色});
            --sc: oklch(from ${color.次色} calc(l + 0.3) c h);
            --a: oklch(${color.強調色});
            --ac: oklch(from ${color.強調色} calc(l + 0.3) c h);
            --t: oklch(${color.輔助色});
            --tc: oklch(from ${color.輔助色} calc(l + 0.3) c h);
            --n: oklch(${color.中性色});
            --nc: oklch(from ${color.中性色} calc(l + 0.3) c h);
            --b1: oklch(${color.背景1});
            --b2: oklch(${color.背景2});
            --b3: oklch(${color.背景3});
            --bc: oklch(${color.背景內容});
            --in: oklch(${color.資訊色});
            --inc: oklch(from ${color.資訊色} calc(l + 0.3) c h);
            --su: oklch(${color.成功色});
            --suc: oklch(from ${color.成功色} calc(l + 0.3) c h);
            --wa: oklch(${color.警告色});
            --wac: oklch(from ${color.警告色} calc(l + 0.3) c h);
            --er: oklch(${color.錯誤色});
            --erc: oklch(from ${color.錯誤色} calc(l + 0.3) c h);

            /* skeleton defaults */
            --sk-container-width: ${sk.containerWidth};
            --sk-container-px: ${sk.containerPaddingX};
            --sk-section-py: ${sk.sectionPaddingY};
            --sk-section-py-lg: ${sk.sectionPaddingYLarge};
            --sk-card-bg: ${sk.cardBg};
            --sk-card-border: ${sk.cardBorder};
            --sk-card-radius: ${sk.cardRadius};
            --sk-card-shadow: ${sk.cardShadow};
            --sk-card-padding: ${sk.cardPadding};
            --sk-card-radius-lg: ${sk.cardLgRadius};
            --sk-card-shadow-lg: ${sk.cardLgShadow};
            --sk-card-padding-lg: ${sk.cardLgPadding};
            --sk-stack-gap: ${sk.stackGap};
            --sk-stack-gap-sm: ${sk.stackGapSm};
            --sk-stack-gap-lg: ${sk.stackGapLg};
            --sk-round-sm: ${sk.roundSm};
            --sk-round: ${sk.round};
            --sk-round-lg: ${sk.roundLg};
            --sk-fade-duration: ${sk.fadeDuration};
            --sk-fade-distance: ${sk.fadeDistance};
          }
        `,
      },
    ],
    rules: [
      ...colorRules,
      ...skeletonRules,
    ],
  };
});
