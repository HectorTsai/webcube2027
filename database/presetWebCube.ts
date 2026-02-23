import { definePreset } from "@unocss/core";

export interface WebCubeTheme {
  主色: string;
  次色: string;
  強調色: string;
  中性色: string;
  背景1: string;
  背景2: string;
  背景3: string;
  背景內容: string;
  資訊色: string;
  成功色: string;
  警告色: string;
  錯誤色: string;
}

export const presetWebCube = definePreset((options?: { theme?: WebCubeTheme }) => {
  const theme = options?.theme || getDefaultTheme();

  return {
    name: 'webcube',
    preflights: [
      {
        getCSS: () => `
          :root {
            --p: ${theme.主色};
            --pc: oklch(from ${theme.主色} calc(l + 0.3) c h);
            --s: ${theme.次色};
            --sc: oklch(from ${theme.次色} calc(l + 0.3) c h);
            --a: ${theme.強調色};
            --ac: oklch(from ${theme.強調色} calc(l + 0.3) c h);
            --n: ${theme.中性色};
            --nc: oklch(from ${theme.中性色} calc(l + 0.3) c h);
            --b1: ${theme.背景1};
            --b2: ${theme.背景2};
            --b3: ${theme.背景3};
            --bc: ${theme.背景內容};
            --in: ${theme.資訊色};
            --inc: oklch(from ${theme.資訊色} calc(l + 0.3) c h);
            --su: ${theme.成功色};
            --suc: oklch(from ${theme.成功色} calc(l + 0.3) c h);
            --wa: ${theme.警告色};
            --wac: oklch(from ${theme.警告色} calc(l + 0.3) c h);
            --er: ${theme.錯誤色};
            --erc: oklch(from ${theme.錯誤色} calc(l + 0.3) c h);
          }
        `,
      },
    ],
    rules: [
      // Primary colors
      ['bg-primary', { 'background-color': 'var(--p)' }],
      ['text-primary', { 'color': 'var(--pc)' }],
      ['border-primary', { 'border-color': 'var(--p)' }],
      ['bg-primary-focus', { 'background-color': 'oklch(from var(--p) calc(l - 0.1) c h)' }],
      ['bg-primary-content', { 'background-color': 'var(--pc)' }],

      // Secondary colors
      ['bg-secondary', { 'background-color': 'var(--s)' }],
      ['text-secondary', { 'color': 'var(--sc)' }],
      ['border-secondary', { 'border-color': 'var(--s)' }],
      ['bg-secondary-focus', { 'background-color': 'oklch(from var(--s) calc(l - 0.1) c h)' }],
      ['bg-secondary-content', { 'background-color': 'var(--sc)' }],

      // Accent colors
      ['bg-accent', { 'background-color': 'var(--a)' }],
      ['text-accent', { 'color': 'var(--ac)' }],
      ['border-accent', { 'border-color': 'var(--a)' }],
      ['bg-accent-focus', { 'background-color': 'oklch(from var(--a) calc(l - 0.1) c h)' }],
      ['bg-accent-content', { 'background-color': 'var(--ac)' }],

      // Neutral colors
      ['bg-neutral', { 'background-color': 'var(--n)' }],
      ['text-neutral', { 'color': 'var(--nc)' }],
      ['border-neutral', { 'border-color': 'var(--n)' }],
      ['bg-neutral-focus', { 'background-color': 'oklch(from var(--n) calc(l - 0.1) c h)' }],
      ['bg-neutral-content', { 'background-color': 'var(--nc)' }],

      // Base colors
      ['bg-base-100', { 'background-color': 'var(--b1)' }],
      ['bg-base-200', { 'background-color': 'var(--b2)' }],
      ['bg-base-300', { 'background-color': 'var(--b3)' }],
      ['bg-base-content', { 'background-color': 'var(--bc)' }],
      ['text-base-content', { 'color': 'var(--bc)' }],

      // Info colors
      ['bg-info', { 'background-color': 'var(--in)' }],
      ['text-info', { 'color': 'var(--inc)' }],
      ['border-info', { 'border-color': 'var(--in)' }],
      ['bg-info-content', { 'background-color': 'var(--inc)' }],

      // Success colors
      ['bg-success', { 'background-color': 'var(--su)' }],
      ['text-success', { 'color': 'var(--suc)' }],
      ['border-success', { 'border-color': 'var(--su)' }],
      ['bg-success-content', { 'background-color': 'var(--suc)' }],

      // Warning colors
      ['bg-warning', { 'background-color': 'var(--wa)' }],
      ['text-warning', { 'color': 'var(--wac)' }],
      ['border-warning', { 'border-color': 'var(--wa)' }],
      ['bg-warning-content', { 'background-color': 'var(--wac)' }],

      // Error colors
      ['bg-error', { 'background-color': 'var(--er)' }],
      ['text-error', { 'color': 'var(--erc)' }],
      ['border-error', { 'border-color': 'var(--er)' }],
      ['bg-error-content', { 'background-color': 'var(--erc)' }],
    ],
  };
});

function getDefaultTheme(): WebCubeTheme {
  return {
    主色: '59.67% 0.221 258.03',
    次色: '39.24% 0.128 255',
    強調色: '77.86% 0.1489 226.0173',
    中性色: '35.5192% .032071 262.988584',
    背景1: '100% 0 0',
    背景2: '93% 0 0',
    背景3: '88% 0 0',
    背景內容: '35.5192% .032071 262.988584',
    資訊色: '71.17% 0.166 241.15',
    成功色: '60.9% 0.135 161.2',
    警告色: '73% 0.19 52',
    錯誤色: '57.3% 0.234 28.28',
  };
}
