import {ComponentProps} from "../classes.ts";

export interface InputProps extends ComponentProps {
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
