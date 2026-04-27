import {ComponentProps} from "../classes.ts";
import Timeline from "./Timeline.tsx";
import TimelineItem from "./TimelineItem.tsx";

export interface TimelineProps extends ComponentProps {
  /** 是否为垂直时间线 */
  vertical?: boolean;
  /** 动画类名 */
  animate?: string;
}

export interface TimelineItemProps extends ComponentProps {
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
}

export { Timeline, TimelineItem };
export default Timeline;