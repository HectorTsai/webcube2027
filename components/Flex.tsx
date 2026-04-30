import { ComponentProps, directionClasses, justifyClasses, alignClasses, gapClasses, paddingClasses, marginClasses } from './classes.ts';

export interface FlexProps extends ComponentProps {
  /** 排列方向 */
  direction?: 'row' | 'column';
  /** 是否換行 */
  wrap?: boolean;
  /** 間距 */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 主軸對齊 */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** 交叉軸對齊 */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** 內距 */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 外距 */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
}

export default function Flex({
  children,
  direction = 'row',
  wrap = false,
  gap = 'none',
  justify = 'start',
  align = 'stretch',
  padding = 'none',
  margin = 'none',
  className = '',
  ...restProps
}: FlexProps) {
  // 建立 CSS 類別字串
  const classes = [
    'flex',
    directionClasses[direction],
    wrap ? 'flex-wrap' : '',
    gapClasses[gap],
    justifyClasses[justify],
    alignClasses[align],
    paddingClasses[padding],
    marginClasses[margin],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}