// Container/index.tsx - 萬物起源：結構、排版與尺寸指針控制中心
import { BaseComponentProps, sizeScaleMatrix, ComponentSize, directionClasses } from "../classes.ts";
import createVariantComponent from "../index.ts";

// 擴充 Container 專屬的 Props 介面，全面開放與資料庫骨架對應的欄位強型別
export interface ContainerProps extends BaseComponentProps {
  size?: ComponentSize;
  direction?: "row" | "column";
  width?: string;
  height?: string;
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | (string & {}); // 容納資料庫所有空間 Key
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "auto" | (string & {});
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | (string & {});
  rounded?: "none" | "sm" | "md" | "lg" | "avatar" | "full" | (string & {});         // 容納資料庫所有圓角 Key
  shadow?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  active?: boolean;          // 保留給變體組件（如 solid.tsx）結合 Alpine.js 使用
  activeStateName?: string;  // 保留給變體組件（如 solid.tsx）結合 Alpine.js 使用
  [key: string]: any;
}

/**
 * 萬物起源核心處理器：Container 的比例與結構控制中心
 * 職責：智能調配全域 size 指針與局部覆寫參數，輸出最乾淨、最高效的 UnoCSS 類名與樣式組合。
 * * @param props 組件傳入的屬性
 * @returns { inlineStyles: Record<string, string>, baseClassesStr: string }
 */
export function 準備Container基底(props: ContainerProps) {
  const {
    size = "md",
    direction = "column",
    width = "auto",
    height = "auto",
    margin = "none",
    shadow = "none",
    hover = false,
    className
  } = props;

  // 1. 從 classes.ts 的 10 階級擴充矩陣中取得該 size 對應的預設骨架 Keys
  const scale = sizeScaleMatrix[size] || sizeScaleMatrix["md"];

  // 2. 智能推導與覆寫機制：優先使用傳入的個別 Props，其次採用矩陣推導出的預設骨架 Key
  const finalPaddingKey = props.padding ?? scale.spaceKey;
  const finalGapKey     = props.gap     ?? scale.spaceKey;
  const finalRadiusKey  = props.rounded ?? scale.radiusKey;
  const finalFontKey    = scale.fontKey;

  // 3. 處理物理寬高 Layout（如果是 'full' 走 UnoCSS 類名，如果是 px/rem 自訂數值則安全走 inline style）
  const widthStyle = (width === "full" || width === "auto") ? undefined : width;
  const heightStyle = (height === "full" || height === "auto") ? undefined : height;
  
  const widthClass = (width === "full") ? "w-full" : undefined;
  const heightClass = (height === "full") ? "h-full" : undefined;

  // 4. 組合最極致的純排版與骨架 Class（完全不包含任何背景色與文字色，保留給變體元件或 Alpine 動態控制）
  // 這裡輸出的類名（如 p-md, rounded-lg）會完美對接 unocss-generator 注入 Theme 的動態骨架！
  const baseClassesStr = [
    "flex",
    "box-border",
    directionClasses[direction] || "flex-col",
    widthClass,
    heightClass,
    finalPaddingKey !== "none" ? `p-${finalPaddingKey}` : "p-0",
    margin !== "none" ? (margin === "auto" ? "mx-auto" : `m-${margin}`) : undefined,
    finalGapKey !== "none" ? `gap-${finalGapKey}` : "gap-0",
    finalRadiusKey !== "none" ? `rounded-${finalRadiusKey}` : "rounded-none",
    shadow !== "none" ? `shadow-${shadow}` : "shadow-none",
    `leading-${finalFontKey}`,  // 行高自動隨 size 連動（可一路狂飆放大到 9xl）
    hover ? "transition-all duration-200" : undefined,
    className
  ].filter(Boolean).join(" ");

  // 5. 拼裝行內樣式，確保外層客製化 style 的覆寫權力
  const inlineStyles: Record<string, string> = {
    ...(widthStyle ? { width: widthStyle } : {}),
    ...(heightStyle ? { height: heightStyle } : {}),
    ...props.style
  };

  return { inlineStyles, baseClassesStr };
}

// 6. 註冊並導出 Container 主組件工廠
// 這裡會經過根目錄 index.ts 的 createVariantComponent 核心，完美擁有 Deno 2 動態 import 快取
// 且在使用者未指定 variant 時，會自動防禦性讀取 context 骨架中的預設風格
export default createVariantComponent("Container");