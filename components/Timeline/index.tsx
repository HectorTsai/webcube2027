import Timeline from "./Timeline.tsx";
import TimelineItem from "./TimelineItem.tsx";

export interface TimelineProps {
  /** 子元素 */
  children: unknown;
  /** 是否为垂直时间线 */
  vertical?: boolean;
  /** 动画类名 */
  animate?: string;
  /** 自定义类名 */
  className?: string;
  /** 时间线颜色 */
  color?: string;
  /** 时间线变体 */
  variant?: string;
}

export interface TimelineItemProps {
  /** 子元素 */
  children?: unknown;
  /** 时间线起始内容 */
  start?: any;
  /** 时间线末端内容 */
  end?: any;
  /** 图标 - Database icon ID */
  icon?: string;
  /** 图标 - Direct icon file path */
  src?: string;
  /** 图标 - SVG string content */
  svg?: string;
  /** 时间线颜色 */
  color?: string;
  /** 时间线变体 */
  variant?: string;
  /** 自定义类名 */
  className?: string;
}

export { Timeline, TimelineItem };
export default Timeline;