// classes.ts (型別合約回歸：全站元件最高型別守護神)

// =========================================================================
// 1. 全站純淨強型別系統定義（最高規格）
// =========================================================================
export type BaseColor = "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger" | "base" | "neutral" | "current" | "current-content";
export type ColorShade = 10 | 30 | 50 | 70 | 90 | number; // 允許任意數字輸入，由 UnoCSS 智慧收斂
export type Color = 
  | BaseColor
  | `${BaseColor}-${ColorShade}`
  | `${BaseColor}/${number}`
  | `${BaseColor}-${ColorShade}/${number}`
  | (string & {});

export type ComponentSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "9xl";

/**
 * 👑 全站元件最高通用參數合約 (ComponentProps)
 * 所有智慧型組件（Container, Button, Input 等）都必須繼承此介面！
 * 繼承 Record<string, any> 是為了讓元件能自由接收 onClick, id, disabled 等標準 HTML 屬性
 */
export interface BaseComponentProps extends Record<string, any> {
  children?: any;
  color?: Color;       // 🎨 供電顏色，預設 primary
  size?: ComponentSize; // 📐 尺寸語意
  className?: string;  // 🔤 外部局部附加類名
  style?: any;         // 🧪 外部局部行內樣式
} 

// =========================================================================
// 2. 唯一核心解析大腦 (OKLCH 剝殼機)
// =========================================================================
export function parseColor(colorStr: string) {
  const [main, opacityStr] = colorStr.split('/');
  const opacity = opacityStr ? parseInt(opacityStr, 10) : 100;
  
  if (main.endsWith('-content')) {
    return { base: main, shade: 100, opacity: opacity };
  }
  
  const match = main.match(/^([a-zA-Z-]+)(?:-(\d+))?$/);
  if (!match) return { base: main, shade: 100, opacity: opacity };
  
  return {
    base: match[1],
    shade: match[2] ? parseInt(match[2], 10) : 100,
    opacity: opacity
  };
}

// =========================================================================
// 3. 全站通用 DOM 防禦大閘門
// =========================================================================
/**
 * 🎯 升級版安全閘門：
 * 傳入全域原始的 props，它會把設計系統的內政包袱、以及元件要親自拼裝的 class/style 統通扣留下來，
 * 唯獨放行 id, onClick, disabled, data-* 等原生 HTML 屬性，防禦 DOM 樹污染。
 */
export function 過濾無效Props(props: Record<string, any>): Record<string, any> {
  const { 
    // 扣留：設計系統專用參數
    size, color, variant, hover, active, activeStateName, 
    風格模型, 裝飾模型, 骨架模型, 配色模型,
    direction, width, height, padding, margin, gap, rounded, shadow, border,

    // 扣留：已被元件自身解構與手動融合完畢的通用參數（防重複鬧雙胞）
    className, style, children,

    // 放行：其餘原生 HTML 屬性與事件（含 Alpine x-* / @*，但會被過濾掉）
    ...domSafeRest 
  } = props;
  
  // 過濾 Alpine 屬性：x-*、@* 只應由 wrapper 標籤承接，不該洩漏到內部元素
  const domSafe: Record<string, any> = {};
  const keys = Object.keys(domSafeRest);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (!k.startsWith("x-") && !k.startsWith("@")) {
      domSafe[k] = domSafeRest[k];
    }
  }
  return domSafe;
}