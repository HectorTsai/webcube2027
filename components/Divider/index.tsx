import {ComponentProps} from "../classes.ts";

export interface DividerProps extends ComponentProps {
  /** 是否水平 */
  horizontal?: boolean;
  /** 位置 */
  position?: "start" | "center" | "end";
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export { default as Divider } from "./Divider.tsx";
