/**
 * 共用的元件類型定義
 */

// ReactNode 型別定義
export type ReactNode =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReactElement
  | ReactNode[];

// ReactElement 型別定義
export interface ReactElement {
  type: string | ComponentType<Record<string, unknown>>;
  props: Record<string, unknown>;
  key: string | number | null;
}

// 元件型別定義
export type ComponentType<P = Record<string, unknown>> =
  | ((props: P) => ReactNode)
  | (new (props: P) => { render(): ReactNode });

// 顏色類型
export type 顏色類型 =
  | "主要"
  | "次要"
  | "輔助"
  | "強調"
  | "隱藏"
  | "連結"
  | "資訊"
  | "成功"
  | "警告"
  | "錯誤";

// 尺寸類型
export type 尺寸類型 = "超大" | "大" | "中" | "小" | "超小";

// 圓角類型
export type 圓角類型 = "大" | "中" | "小";

// 基礎元件 Props
export interface 基礎元件Props {
  顏色?: 顏色類型;
  尺寸?: 尺寸類型;
  圓角?: 圓角類型;
  外框?: boolean;
  停用?: boolean;
  載入中?: boolean;
  onClick?: () => void;
  children?: string | number | ReactNode | ReactNode[] | null | undefined;
}

// CSS 變數映射
export const 顏色變數映射 = {
  主要: { bg: "--p", text: "--pc" },
  次要: { bg: "--s", text: "--sc" },
  輔助: { bg: "--t", text: "--tc" },
  強調: { bg: "--a", text: "--ac" },
  中性: { bg: "--n", text: "--nc" },
  資訊: { bg: "--in", text: "--inc" },
  成功: { bg: "--su", text: "--suc" },
  警告: { bg: "--wa", text: "--wac" },
  錯誤: { bg: "--er", text: "--erc" },
  隱藏: { bg: "--b2", text: "--bc" },
  連結: { bg: "--b2", text: "--bc" },
} as const;

// 尺寸 CSS 類別映射
export const 尺寸類別映射 = {
  超大: "px-8 py-4 text-xl",
  大: "px-6 py-3 text-lg",
  中: "px-4 py-2 text-base",
  小: "px-3 py-1.5 text-sm",
  超小: "px-2 py-1 text-xs",
} as const;

// 圓角 CSS 類別映射
export const 圓角類別映射 = {
  大: "var(--rounded-box)", // 大圓角
  中: "var(--rounded-field)", // 中圓角
  小: "var(--rounded-selector)", // 小圓角
} as const;
