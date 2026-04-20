import type { ButtonProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default async function Button({
  children,
  color = "primary",
  variant = "solid",
  size = "md",
  disabled = false,
  active = true,
  type = "button",
  onClick,
  rounded = "sm",
  className,
  ...restProps
}: ButtonProps) {
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
    sizeClasses[size].text,
    disabled && "opacity-50 cursor-not-allowed",
    className
  ];

  const buttonClasses = finalButtonClasses.filter(Boolean).join(" ");

  const finalContainerClasses = [
    sizeClasses[size].padding,
  ];

  const containerClasses = finalContainerClasses.filter(Boolean).join(" ");

  const alpineProps: Record<string, string> = {};
  if (onClick) {
    alpineProps['@click'] = onClick;
  }

  const container = await Container({
    variant,
    color,
    padding: "none",
    direction: "row",
    align: "center",
    justify: "center",
    rounded: rounded,
    hover: true,
    active: active,
    className: containerClasses,
    children
  });

  return (
    <button
      type={type}
      disabled={disabled}
      class={buttonClasses}
      {...alpineProps}
      {...restProps}
    >
      {container}
    </button>
  );
}
