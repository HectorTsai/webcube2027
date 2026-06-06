// unocss-rules.ts (2026 完全體 — rule ⇄ shortcut 雙軌分工)
//    c-style-apply   → current token 直譯 CSS variable（transition + 三態）
//    c-div-active    → 非 current active  token，走 UnoCSS 後重寫選擇器
//    c-div-hover     → 非 current hover   token，走 UnoCSS 後重寫選擇器
//    c-div-inactive  → 非 current inactive token，走 UnoCSS 後重寫選擇器
import { Rule } from '@unocss/core';

// ---------- current token → CSS variable ----------
const TOKEN_PREFIX_MAP: Record<string, string> = {
  'bg-': 'background-color',
  'text-': 'color',
  'border-': 'border-color',
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
  return `${selector} {\n  ${declarations.join(' !important;\n  ')} !important;\n}\n`;
}

// ---------- non-current token → UnoCSS 生成後重寫選擇器 ----------
async function generateNonCurrentCSS(
  tokens: string[],
  selector: string,
  generator: any,
): Promise<string> {
  if (tokens.length === 0) return '';
  const input = tokens.join(' ');
  const { css } = await generator.generate(input, { preflights: false, minify: true });
  if (!css.trim()) return '';
  // 只在 rule 開頭（^ 或 } 之後）匹配 class selector，避開 CSS 值中的 .05 等浮點數
  return css.replace(/(^|})(\.\w[\w:-]*)(?=\{)/g, (_m: string, sep: string, _cls: string) => {
    // sep 是 ''（開頭）或 '}'（銜接上條 rule），需要保留以免吃掉分隔符
    return sep + selector;
  }) + '\n';
}

export function getSystemRules(
  activeCurrent: string[] = [],
  hoverCurrent: string[] = [],
  inactiveCurrent: string[] = [],
  activeElse: string[] = [],
  hoverElse: string[] = [],
  inactiveElse: string[] = [],
): Rule<any>[] {
  return [
    // 1. c-style-apply — current token → CSS variable + transition
    [
      /^c-style-apply$/,
      () => {
        let css = `.c-style-apply {\n  transition: background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out;\n}\n`;
        css += buildCurrentCSS(activeCurrent, '.c-style-apply');
        const cleanHover = hoverCurrent.map(cls => cls.replace(/^hover:/, ''));
        css += buildCurrentCSS(cleanHover, '.c-style-apply[data-active="true"][data-hover="true"]:hover');
        const cleanInactive = inactiveCurrent.map(cls => cls.replace(/^inactive:/, ''));
        css += buildCurrentCSS(cleanInactive, '.c-style-apply[data-active="false"]');
        return css.trim();
      }
    ],

    // 2. c-div-active — non-current active token → [data-active="true"] 才通電
    [
      /^c-div-active$/,
      async (_, { generator }) => {
        return await generateNonCurrentCSS(activeElse, '.c-div-active[data-active="true"]', generator);
      }
    ],

    // 3. c-div-hover — non-current hover token → active+hover+:hover 三重門禁
    [
      /^c-div-hover$/,
      async (_, { generator }) => {
        return await generateNonCurrentCSS(hoverElse, '.c-div-hover[data-active="true"][data-hover="true"]:hover', generator);
      }
    ],

    // 4. c-div-inactive — non-current inactive token → [data-active="false"] 才爆發
    [
      /^c-div-inactive$/,
      async (_, { generator }) => {
        return await generateNonCurrentCSS(inactiveElse, '.c-div-inactive[data-active="false"]', generator);
      }
    ],
  ];
}
