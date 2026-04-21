export interface InputProps {
  /** 子元素 */
  children?: unknown;
  /** 自定义类名 */
  className?: string;
  /** 变体 */
  variant?: string;
  /** 颜色 */
  color?: string;
  /** 前端标签 */
  frontLabel?: string;
  /** 后端标签 */
  endLabel?: string;
  /** 浮动标签 */
  floatLabel?: string;
  /** 任何额外属性 */
  [key: string]: any;
}

export { default as default } from "./Input.tsx";
