// unocss-rules.ts (2026 簡化版 — c-style-apply 一軌通吃四態)
import { Rule } from '@unocss/core';

// ---------- current token → CSS variable ----------
const TOKEN_PREFIX_MAP: Record<string, string> = {
  'bg-': 'background-color',
  'text-': 'color',
  'border-': 'border-color',
  'ring-': '--un-ring-color',
};

function resolveCurrentToken(token: string): string {
  for (const [prefix, prop] of Object.entries(TOKEN_PREFIX_MAP)) {
    if (token.startsWith(prefix)) {
      return `${prop}: oklch(var(--c-${token.slice(prefix.length)}))`;
    }
  }
  return '';
}

function buildCurrentCSS(tokens: string[], selector: string): string {
  if (tokens.length === 0) return '';
  const declarations = tokens.map(resolveCurrentToken).filter(Boolean);
  if (declarations.length === 0) return '';
  return `${selector} {\n  ${declarations.join(';\n  ')};\n}\n`;
}

// ---------- non-current token → UnoCSS 解析後提取宣告、重包選擇器 ----------
async function generateNonCurrentCSS(
  tokens: string[],
  selector: string,
  generator: any,
): Promise<string> {
  if (tokens.length === 0) return '';

  const fakeHtml = `<div class="${tokens.join(' ')}"></div>`;
  const { css } = await generator.generate(fakeHtml, { preflights: false });
  if (!css) return '';

  const blocks = [...css.matchAll(/\{([^}]+)\}/g)];
  if (blocks.length === 0) return '';

  const allDeclarations = blocks
    .map(m => m[1].trim())
    .join(';')
    .split(';')
    .map(d => d.trim())
    .filter(Boolean);

  if (allDeclarations.length === 0) return '';

  return `${selector} {\n  ${allDeclarations.join(';\n  ')};\n}\n`;
}

export function getSystemRules(
  activeCurrent: string[] = [],
  hoverCurrent: string[] = [],
  inactiveCurrent: string[] = [],
  selectedCurrent: string[] = [],
  focusCurrent: string[] = [],
  activeElse: string[] = [],
  hoverElse: string[] = [],
  inactiveElse: string[] = [],
  selectedElse: string[] = [],
  focusElse: string[] = [],
  elseGenerator?: any,
): Rule<any>[] {
  // 🔑 使用獨立 elseGenerator 解析常規 token，避免在 rule 內部調用主 generator.generate() 時遞迴失敗
  const gen = elseGenerator;

  // helper：為 current utility 加上 /{opacity} 修飾符支援
  const parseOpacity = (cssProp: string, cssVar: string) =>
    (match: RegExpMatchArray): Record<string, string> => {
      const o = match[1] as string | undefined;
      return { [cssProp]: `oklch(var(${cssVar})${o ? ` / ${parseInt(o.slice(1), 10) / 100}` : ''})` };
    };

  return [
    // 0. cube-color-{color} — 純供電：注入 --c-current 變數
    [
      /^cube-color-(.+)$/,
      ([, color]) => ({
        '--c-current': `var(--color-${color}-raw)`,
        '--c-current-content': `var(--color-${color}-content-raw)`,
        '--c-current-10': `var(--color-${color}-10-raw)`,
        '--c-current-30': `var(--color-${color}-30-raw)`,
        '--c-current-50': `var(--color-${color}-50-raw)`,
        '--c-current-70': `var(--color-${color}-70-raw)`,
        '--c-current-90': `var(--color-${color}-90-raw)`,
      }),
    ],

    // 0a–0d. 獨立 current utility（支援 /{opacity} 修飾符）
    [/^text-current(\/\d+)?$/, parseOpacity('color', '--c-current')],
    [/^text-current-content(\/\d+)?$/, parseOpacity('color', '--c-current-content')],
    [/^bg-current(\/\d+)?$/, parseOpacity('background-color', '--c-current')],
    [/^bg-current-content(\/\d+)?$/, parseOpacity('background-color', '--c-current-content')],
    [/^border-current(\/\d+)?$/, parseOpacity('border-color', '--c-current')],
    [/^border-current-content(\/\d+)?$/, parseOpacity('border-color', '--c-current-content')],

    // 1. c-style-apply — 四態歸一的主核心軌道
    [
      /^c-style-apply$/,
      async () => {
        let css = `.c-style-apply {\n  transition: background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out;\n}\n`;

        // ⚡️ active 基礎層
        css += buildCurrentCSS(activeCurrent, '.c-style-apply[data-active="true"]');
        css += await generateNonCurrentCSS(activeElse, '.c-style-apply[data-active="true"]', gen);

        // 🟣 selected 疊加層 — strip selected: 前綴後餵入 generator
        const cleanSelected = selectedElse.map(cls => cls.replace(/^selected:/, ''));
        css += buildCurrentCSS(selectedCurrent, '.c-style-apply[data-active="true"][data-selected="true"]');
        const selectedRawCss = await generateNonCurrentCSS(cleanSelected, '.c-style-apply[data-active="true"][data-selected="true"]', gen);
        if (selectedRawCss) {
          css += selectedRawCss.replace(/;/g, ' !important;').replace(/!important\s+!important/g, '!important');
        }

        // 🔮 hover 疊加層
        const cleanHover = hoverCurrent.map(cls => cls.replace(/^hover:/, ''));
        css += buildCurrentCSS(cleanHover, '.c-style-apply[data-active="true"][data-hover="true"]:hover');
        css += await generateNonCurrentCSS(hoverElse, '.c-style-apply[data-active="true"][data-hover="true"]:hover', gen);

        // 🎯 focus 疊加層 — keyboard focus ring，需 active + focus 雙重門禁
        const cleanFocus = focusCurrent.map(cls => cls.replace(/^focus:/, ''));
        css += buildCurrentCSS(cleanFocus, '.c-style-apply[data-active="true"][data-focus="true"]:focus');
        css += await generateNonCurrentCSS(focusElse, '.c-style-apply[data-active="true"][data-focus="true"]:focus', gen);

        // 🔴 inactive 斷電層
        const cleanInactive = inactiveCurrent.map(cls => cls.replace(/^inactive:/, ''));
        css += buildCurrentCSS(cleanInactive, '.c-style-apply[data-active="false"]');
        css += await generateNonCurrentCSS(inactiveElse, '.c-style-apply[data-active="false"]', gen);

        return css.trim();
      },
    ],
  ];
}
