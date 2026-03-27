export interface SectionProps {
  /** Child elements to render in the section */
  children: any;
  /** Background color or style */
  background?: "white" | "gray" | "primary" | "secondary" | "gradient";
  /** Internal spacing of the section */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Maximum width of the section content */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full" | "screen";
}

export default function Section({
  children,
  background = "white",
  padding = "lg",
  maxWidth = "full",
}: SectionProps) {
  const baseClasses = "w-full";
  
  const backgroundClasses = {
    white: "bg-base-100",
    gray: "bg-base-200",
    primary: "bg-primary",
    secondary: "bg-secondary",
    gradient: "bg-gradient-to-br from-primary to-secondary",
  };
  
  const paddingClasses = {
    none: "",
    xs: "py-xs",
    sm: "py-sm",
    md: "py-md",
    lg: "py-lg",
    xl: "py-xl",
    "2xl": "py-2xl",
  };
  
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
    screen: "max-w-screen-xl",
  };

  const classes = `${baseClasses} ${backgroundClasses[background]} ${paddingClasses[padding]} mx-auto ${maxWidthClasses[maxWidth]}`;

  return <section class={classes}>{children}</section>;
}
