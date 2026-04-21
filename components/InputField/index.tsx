export interface InputFieldProps {
  /** 子元素 */
  children?: unknown;
  /** 自定义类名 */
  className?: string;
  /** 变体 */
  variant?: string;
  /** 颜色 */
  color?: string;
  /** 圆角 */
  rounded?: "none" | "sm" | "md" | "lg";
}

export { default } from "./InputField.tsx";
