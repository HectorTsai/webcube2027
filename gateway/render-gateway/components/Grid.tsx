import { justifyClasses, alignClasses, gapClasses, paddingClasses, marginClasses } from './classes.ts';
import { processChildren } from './index.ts';

export interface GridProps {
  /** 網格列數 */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none';
  /** 響應式網格列數 */
  colsSm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none';
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none';
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none';
  colsXl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none';
  /** 間距 */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 行間距 */
  gapY?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 列間距 */
  gapX?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 水平對齊 */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** 垂直對齊 */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** 內距 */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 外距 */
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  /** 是否自動填充 */
  autoFill?: boolean;
  /** 是否自動調整 */
  autoFit?: boolean;
  className?: string;
  children: unknown;
}

// 網格列數類別映射
const gridColsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
  none: ''
};

// 響應式網格類別映射
const responsiveGridClasses = (breakpoint: string, cols: number | 'none') => {
  if (cols === 'none') return '';
  return `${breakpoint}:grid-cols-${cols}`;
};

// 間距類別映射（行和列）
const gapYClasses = {
  none: 'gap-y-0',
  xs: 'gap-y-xs',
  sm: 'gap-y-sm',
  md: 'gap-y-md',
  lg: 'gap-y-lg',
  xl: 'gap-y-xl'
};

const gapXClasses = {
  none: 'gap-x-0',
  xs: 'gap-x-xs',
  sm: 'gap-x-sm',
  md: 'gap-x-md',
  lg: 'gap-x-lg',
  xl: 'gap-x-xl'
};

export default function Grid({
  children,
  color,
  variant,
  context,
  cols = 1,
  colsSm,
  colsMd,
  colsLg,
  colsXl,
  gap = 'none',
  gapY,
  gapX,
  justify = 'start',
  align = 'stretch',
  padding = 'none',
  margin = 'none',
  autoFill = false,
  autoFit = false,
  className = '',
  ...restProps
}: GridProps) {
  // 建立 CSS 類別字串
  const classes = [
    'grid',
    gridColsClasses[cols],
    colsSm && responsiveGridClasses('sm', colsSm),
    colsMd && responsiveGridClasses('md', colsMd),
    colsLg && responsiveGridClasses('lg', colsLg),
    colsXl && responsiveGridClasses('xl', colsXl),
    gapY ? gapYClasses[gapY] : gapClasses[gap],
    gapX ? gapXClasses[gapX] : gapClasses[gap],
    justifyClasses[justify],
    alignClasses[align],
    paddingClasses[padding],
    marginClasses[margin],
    autoFill ? 'grid-auto-fill' : '',
    autoFit ? 'grid-auto-fit' : '',
    className
  ].filter(Boolean).join(' ');

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div className={classes} {...restProps}>
      {processedChildren}
    </div>
  );
}