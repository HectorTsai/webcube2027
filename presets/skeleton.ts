export interface SkeletonTheme {
  containerWidth: string;
  containerPaddingX: string;
  sectionPaddingY: string;
  sectionPaddingYLarge: string;
  cardBg: string;
  cardBorder: string;
  cardRadius: string;
  cardShadow: string;
  cardPadding: string;
  cardLgRadius: string;
  cardLgShadow: string;
  cardLgPadding: string;
  stackGap: string;
  stackGapSm: string;
  stackGapLg: string;
  roundSm: string;
  round: string;
  roundLg: string;
  fadeDuration: string;
  fadeDistance: string;
}

export const DEFAULT_SKELETON_THEME: SkeletonTheme = {
  containerWidth: 'min(1200px, 100%)',
  containerPaddingX: '1.5rem',
  sectionPaddingY: '2rem',
  sectionPaddingYLarge: '3rem',
  cardBg: 'var(--b1, #fff)',
  cardBorder: '1px solid var(--bc, #e5e7eb)',
  cardRadius: '0.75rem',
  cardShadow: '0 10px 30px rgba(0,0,0,0.04)',
  cardPadding: '1.25rem',
  cardLgRadius: '1rem',
  cardLgShadow: '0 18px 48px rgba(0,0,0,0.06)',
  cardLgPadding: '1.75rem',
  stackGap: '1rem',
  stackGapSm: '0.75rem',
  stackGapLg: '1.5rem',
  roundSm: '0.5rem',
  round: '0.75rem',
  roundLg: '1rem',
  fadeDuration: '260ms',
  fadeDistance: '4px',
};

const t = DEFAULT_SKELETON_THEME;

export const skeletonRules = [
  // 版面容器
  ['sk-container', {
    width: `var(--sk-container-width, ${t.containerWidth})`,
    'margin-left': 'auto',
    'margin-right': 'auto',
    'padding-left': `var(--sk-container-px, ${t.containerPaddingX})`,
    'padding-right': `var(--sk-container-px, ${t.containerPaddingX})`,
  }],

  // 區塊
  ['sk-section', {
    'padding-top': `var(--sk-section-py, ${t.sectionPaddingY})`,
    'padding-bottom': `var(--sk-section-py, ${t.sectionPaddingY})`,
  }],
  ['sk-section-lg', {
    'padding-top': `var(--sk-section-py-lg, ${t.sectionPaddingYLarge})`,
    'padding-bottom': `var(--sk-section-py-lg, ${t.sectionPaddingYLarge})`,
  }],

  // 卡片/面板
  ['sk-card', {
    'background-color': `var(--sk-card-bg, ${t.cardBg})`,
    'border': `var(--sk-card-border, ${t.cardBorder})`,
    'border-radius': `var(--sk-card-radius, ${t.cardRadius})`,
    'box-shadow': `var(--sk-card-shadow, ${t.cardShadow})`,
    'padding': `var(--sk-card-padding, ${t.cardPadding})`,
  }],
  ['sk-card-lg', {
    'background-color': `var(--sk-card-bg, ${t.cardBg})`,
    'border': `var(--sk-card-border, ${t.cardBorder})`,
    'border-radius': `var(--sk-card-radius-lg, ${t.cardLgRadius})`,
    'box-shadow': `var(--sk-card-shadow-lg, ${t.cardLgShadow})`,
    'padding': `var(--sk-card-padding-lg, ${t.cardLgPadding})`,
  }],

  // 排版：垂直堆疊
  ['sk-stack', {
    'display': 'flex',
    'flex-direction': 'column',
    'gap': `var(--sk-stack-gap, ${t.stackGap})`,
  }],
  ['sk-stack-sm', {
    'display': 'flex',
    'flex-direction': 'column',
    'gap': `var(--sk-stack-gap-sm, ${t.stackGapSm})`,
  }],
  ['sk-stack-lg', {
    'display': 'flex',
    'flex-direction': 'column',
    'gap': `var(--sk-stack-gap-lg, ${t.stackGapLg})`,
  }],

  // 圓角
  ['sk-round-sm', { 'border-radius': `var(--sk-round-sm, ${t.roundSm})` }],
  ['sk-round', { 'border-radius': `var(--sk-round, ${t.round})` }],
  ['sk-round-lg', { 'border-radius': `var(--sk-round-lg, ${t.roundLg})` }],

  // 動畫：淡入
  ['sk-fade-in', {
    'animation': `sk-fade-in var(--sk-fade-duration, ${t.fadeDuration}) ease-in-out both`,
  }],
  ['@keyframes sk-fade-in', {
    'from': { opacity: 0, transform: `translateY(var(--sk-fade-distance, ${t.fadeDistance}))` },
    'to': { opacity: 1, transform: 'translateY(0)' },
  }],
];
