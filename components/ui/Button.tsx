
export interface ButtonProps {
  /** Content to display inside the button */
  children: any;
  /** Button style variant */
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Function called when button is clicked */
  onClick?: () => void;
  /** Button type for form submission */
  type?: "button" | "submit" | "reset";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
}: ButtonProps) {
  // 使用 UnoCSS 自訂 preset 的 classes
  const baseClasses = "btn";
  
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    outline: "border border-base-300 bg-base-100 text-base-content hover:bg-base-200 focus:ring-primary",
    ghost: "text-base-content hover:bg-base-200 focus:ring-base-content",
  };
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-md",
    lg: "text-lg",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;

  return (
    <button
      class={classes}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
