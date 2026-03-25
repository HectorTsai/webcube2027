export interface GridProps {
  /** Child elements to arrange in grid layout */
  children: any;
  /** Number of columns in the grid */
  columns?: number;
  /** Spacing between grid items */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** Internal spacing of the grid container */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
}

export default function Grid({
  children,
  columns = 2,
  gap = "md",
  padding = "md",
}: GridProps) {
  const baseClasses = "grid";
  
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12",
  };
  
  const gapClasses = {
    none: "gap-0",
    xs: "gap-xs",
    sm: "gap-sm",
    md: "gap-md",
    lg: "gap-lg",
    xl: "gap-xl",
  };
  
  const paddingClasses = {
    none: "",
    xs: "p-xs",
    sm: "p-sm",
    md: "p-md",
    lg: "p-lg",
    xl: "p-xl",
  };

  const columnClass = columnClasses[columns as keyof typeof columnClasses] || columnClasses[2];
  const classes = `${baseClasses} ${columnClass} ${gapClasses[gap]} ${paddingClasses[padding]}`;

  return <div class={classes}>{children}</div>;
}
