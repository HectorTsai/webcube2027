import { ComponentProps } from "./classes.ts";
import { processChildren } from "./index.ts";

export interface LinkProps extends ComponentProps {
  /** Button size - controls the padding and font size */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  href?: string;
}

export default async function Link({
  children,
  color = "primary",
  variant = "ghost",
  size = "md",
  href,
  className,
  context,
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  ...restProps
}: LinkProps) {
  const sizeClasses = {
    xs: { text: "text-xs", padding: "px-2 py-1" },
    sm: { text: "text-sm", padding: "px-3 py-1.5" },
    md: { text: "text-md", padding: "px-4 py-2" },
    lg: { text: "text-lg", padding: "px-6 py-3" },
    xl: { text: "text-xl", padding: "px-8 py-4" },
    "2xl": { text: "text-2xl", padding: "px-10 py-5" },
    "3xl": { text: "text-3xl", padding: "px-12 py-6" },
  };

  const finalButtonClasses = [
    "p-0",
    "border-0",
    "bg-transparent",
    "cursor-pointer",
    "no-underline",
    sizeClasses[size].text,
    sizeClasses[size].padding,
    color?`text-${color}-content`:"",
    className
  ];

  const linkClasses = finalButtonClasses.filter(Boolean).join(" ");
  
  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <a
      href={href}
      class={linkClasses}
      {...restProps}
    >
      {processedChildren}
    </a>
  );
}
