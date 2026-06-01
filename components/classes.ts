// classes.ts - 全域原子樣式、色彩字典與尺寸語意調製庫（純 TypeScript，無 JSX 副作用）

// =========================================================================
// 1. 強型別系統定義
// =========================================================================

// 擴充後的色彩強型別系統（完美支援 UnoCSS 任意透明度與自訂亮度，保留 IDE 自動補全）
export type BaseColor = "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger" | "base" | "neutral";
export type ColorShade = 10 | 30 | 50 | 70 | 90;
export type Color = 
  | BaseColor
  | `${BaseColor}-${ColorShade}`
  | `${BaseColor}/${number}`
  | `${BaseColor}-${ColorShade}/${number}`
  | (string & {});

// 擴充後的尺寸強型別系統（最高支援至 9xl，完美適配大標題、巨型 Icon 與 Image）
export type ComponentSize = 
  | "xs" | "sm" | "md" | "lg" | "xl" 
  | "2xl" | "3xl" | "4xl" | "5xl" | "9xl";

// 最抽象的全域基礎元件 Props 定義
export interface BaseComponentProps {
  children?: any;
  color?: Color;
  size?: ComponentSize;
  variant?: string;
  className?: string;
  context?: any;
  style?: any;
} 

// =========================================================================
// 2. 核心刻度鏈條與調製器（大中小模糊比例系統）
// =========================================================================

// 標準的尺寸順序鏈條，讓 adjustSize 可以自由地在 10 個階層內「向左/向右」推移
export const SIZE_ORDER: ComponentSize[] = [
  "xs", "sm", "md", "lg", "xl", 
  "2xl", "3xl", "4xl", "5xl", "9xl"
];

/**
 * 尺寸動態升降級調製器
 * @param size 當前的基礎尺寸 (例如 "md")
 * @param offset 升降級級數 (例如 -1 代表降一級，+2 代表升兩級)
 * @returns 升降級後的 ComponentSize，具備完美的上下邊界保護
 */
export function adjustSize(size: ComponentSize, offset: number): ComponentSize {
  const currentIndex = SIZE_ORDER.indexOf(size);
  
  // 安全防護：如果傳入找不到的未知 size，預設回傳標準中等 md
  if (currentIndex === -1) return "md";
  
  // 計算目標索引
  const targetIndex = currentIndex + offset;
  
  // 邊界防護：太小自動卡在 xs，太大自動卡在 9xl，絕不越界
  if (targetIndex < 0) return SIZE_ORDER[0];
  if (targetIndex >= SIZE_ORDER.length) return SIZE_ORDER[SIZE_ORDER.length - 1];
  
  return SIZE_ORDER[targetIndex];
}

/**
 * 💡 全局尺寸縮放指針矩陣
 * 職責：當 Container 拿到特定 size 時，決定排版屬性要去資料庫骨架(Skeleton)中抓哪一個欄位 Key。
 * * 備註防禦設計：
 * 考慮到資料庫骨架中一般不會特別定義 `空間.9xl` 這種大到誇張的 Padding，
 * 故在巨型尺寸（2xl 以上）時，我們將空間與圓角「飽和封頂」在 3xl 或 lg；
 * 但文字與行高(fontKey)則跟隨 size 毫無保留地一路狂飆放大到 9xl！完美適配大文字與巨型 Icon 的排版美感！
 */
export const sizeScaleMatrix: Record<ComponentSize, { spaceKey: string; radiusKey: string; fontKey: string }> = {
  "xs":  { spaceKey: "xs",  radiusKey: "sm", fontKey: "xs"   },
  "sm":  { spaceKey: "sm",  radiusKey: "sm", fontKey: "sm"   },
  "md":  { spaceKey: "md",  radiusKey: "md", fontKey: "base" }, // 預設標準
  "lg":  { spaceKey: "lg",  radiusKey: "lg", fontKey: "lg"   },
  "xl":  { spaceKey: "xl",  radiusKey: "lg", fontKey: "xl"   },
  
  // 進入巨型尺寸：空間與圓角封頂在骨架的物理合理上限，文字持續放大
  "2xl": { spaceKey: "2xl", radiusKey: "lg", fontKey: "2xl"  }, 
  "3xl": { spaceKey: "3xl", radiusKey: "lg", fontKey: "3xl"  }, 
  "4xl": { spaceKey: "3xl", radiusKey: "lg", fontKey: "4xl"  }, // 空間封頂在 3xl
  "5xl": { spaceKey: "3xl", radiusKey: "lg", fontKey: "5xl"  }, 
  "9xl": { spaceKey: "3xl", radiusKey: "lg", fontKey: "9xl"  }, 
};

// 排版方向映射字典
export const directionClasses = { row: "flex-row", column: "flex-col" };


// =========================================================================
// 3. 靜態樣式對應字典 (保留提供非 Size / 傳統佈局之快速查表需求)
// =========================================================================
export const textClasses = { xs: "text-xs", sm: "text-sm", md: "text-md", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl", "3xl": "text-3xl", "4xl": "text-4xl", "5xl": "text-5xl", "9xl": "text-9xl" };
export const paddingClasses = { none: "p-0", xs: "p-xs", sm: "p-sm", md: "p-md", lg: "p-lg", xl: "p-xl", "2xl": "p-2xl", "3xl": "p-3xl" };
export const marginClasses = { none: "m-0", xs: "m-xs", sm: "m-sm", md: "m-md", lg: "m-lg", xl: "m-xl", auto: "mx-auto" };
export const alignClasses = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };
export const justifyClasses = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between", around: "justify-around", evenly: "justify-evenly" };
export const gapClasses = { none: "gap-0", xs: "gap-xs", sm: "gap-sm", md: "gap-md", lg: "gap-lg", xl: "gap-xl" };
export const roundedClasses = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-full" };
export const shadowClasses = { none: "shadow-none", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" };


// =========================================================================
// 4. 色彩計算與亮度/透明度調製核心 (專為 UnoCSS 複合格式打造)
// =========================================================================

// 高效亮度步進快取 Map (取代執行期迴圈，以 O(1) 極速進行亮度就近對齊)
const SUPPORTED_SHADES = [10, 30, 50, 70, 90];
const SHADE_MAP = new Map<number, number>();
for (let i = 0; i <= 100; i++) {
  let nearest = SUPPORTED_SHADES[0];
  let minDiff = Math.abs(i - nearest);
  for (const step of SUPPORTED_SHADES) {
    const diff = Math.abs(i - step);
    if (diff < minDiff) { minDiff = diff; nearest = step; }
  }
  SHADE_MAP.set(i, nearest);
}

/**
 * 唯一的顏色解析核心專家
 * 職責：將任何 UnoCSS 複合顏色格式（例如 primary-70/45）精準拆解為基礎零件。
 */
export function parseColor(color: string) {
  let base = color;
  let shade: number | undefined = undefined;
  let opacity: number | undefined = undefined;

  // 1. 拆分透明度 (/)
  const slashIdx = color.indexOf("/");
  if (slashIdx !== -1) {
    base = color.slice(0, slashIdx);
    opacity = parseInt(color.slice(slashIdx + 1), 10) || undefined;
  }

  // 2. 拆分亮度 (-)
  const dashIdx = base.lastIndexOf("-");
  if (dashIdx !== -1) {
    const shadeStr = base.slice(dashIdx + 1);
    if (!isNaN(shadeStr as any) && shadeStr !== "") {
      shade = parseInt(shadeStr, 10) || undefined;
      base = base.slice(0, dashIdx);
    }
  }

  return { base, shade, opacity };
}

/**
 * 高效的顏色轉文字色函式
 * 核心機制：一律透過 parseColor 剝離不透明度，確保不論背景多透明，文字皆維持 100% 顯色不透底。
 */
export function color2TextColor(color: string): string {
  const { base, shade } = parseColor(color);
  return shade ? `text-${base}-${shade}-content` : `text-${base}-content`;
}

/**
 * 將 UnoCSS 色票轉為 theme CSS 變數尾綴（對齊 unocss-generator 的 *-light-{shade}）
 * 例: primary-70 → primary-light-70；primary → primary
 */
export function 色票CSS變數名稱(color: string): string {
  const { base, shade } = parseColor(color);
  if (!shade) return base;
  return `${base}-light-${shade}`;
}

/** 剝離色票上的 /透明度，只保留 UnoCSS 色相刻度（如 primary-70） */
export function 色票色相(color: string): string {
  const { base, shade } = parseColor(color);
  return shade ? `${base}-${shade}` : base;
}

/**
 * 高效的顏色亮度/透明度相對調製函式
 * 優化點：完全改用 O(1) 的 Map 查表與純數值切片，移除原先所有慢速且耗 CPU 的正規表達式。
 * @param color 原始顏色字串 (例: "primary" 或 "primary-50/80")
 * @param light 亮度相對減少值 (正數代表變暗、負數代表變亮)
 * @param opacity 透明度相對減少值 (正數代表變透明、負數代表變飽和)
 */
export function adjustColorLightOrOpacity(color: string, light: number, opacity: number): string {
  const parsed = parseColor(color);

  // 若無指定亮度/透明度，預設以 100 滿值計算
  const currentLight = parsed.shade ?? 100;
  const currentOpacity = parsed.opacity ?? 100;

  // 計算並進行範圍安全防禦 [0, 100]
  const calculatedLight = Math.max(0, Math.min(100, currentLight - light));
  const newLight = SHADE_MAP.get(calculatedLight) ?? 100;
  
  const newOpacity = Math.max(0, Math.min(100, currentOpacity - opacity));

  // 根據計算結果，拼裝最乾淨的 UnoCSS 合法格式字串回傳
  if (newOpacity === 100) {
    return newLight === 100 ? parsed.base : `${parsed.base}-${newLight}`;
  }
  return newLight === 100 ? `${parsed.base}/${newOpacity}` : `${parsed.base}-${newLight}/${newOpacity}`;
}

// =========================================================================
// 5. Container × Alpine（與 OptionPicker 等共用 $store.Container）
// =========================================================================

/** 初始化 Alpine.store('Container') 上的狀態鍵 */
export const CONTAINER_STORE_INIT = (name: string, initial: boolean) =>
  `if(!Alpine.store('Container')){Alpine.store('Container',{})}if(Alpine.store('Container').${name}===undefined){Alpine.store('Container').${name}=${initial}}`;

export function containerClassBind(
  activeStateName: string,
  activeClasses: string,
  inactiveClasses: string,
): string {
  return `$store.Container.${activeStateName} ? '${activeClasses}' : '${inactiveClasses}'`;
}

/** 剔除 Container 專用 props，避免寫入 DOM */
export function 過濾無效Props(props: Record<string, unknown>) {
  const {
    size, direction, width, height, padding, margin,
    gap, rounded, shadow, hover, active, activeStateName, color, variant, context, className,
    ...cleanProps
  } = props;
  return cleanProps;
}