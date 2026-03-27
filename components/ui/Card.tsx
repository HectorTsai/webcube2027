export interface CardProps {
  /** Card title displayed at the top */
  title?: string;
  /** Main content of the card */
  content?: string;
  /** URL or path to card image */
  image?: string;
  /** Card style variant */
  variant?: "default" | "outlined" | "elevated";
  /** Card padding size */
  padding?: "none" | "sm" | "md" | "lg";
  /** Whether to show card shadow */
  shadow?: boolean;
}

export default function Card({
  title = "",
  content = "",
  image = "",
  variant = "default",
  padding = "md",
  shadow = true,
}: CardProps) {
  // 使用 UnoCSS 自訂 preset 的 classes
  const baseClasses = "card rounded-md overflow-hidden";
  
  const variantClasses = {
    default: "border border-base-300",
    outlined: "border-2 border-base-300",
    elevated: "shadow-lg",
  };
  
  const paddingClasses = {
    none: "",
    sm: "p-sm",
    md: "p-md",
    lg: "p-lg",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm", 
    md: "shadow-md",
    lg: "shadow-lg"
  };

  const finalShadow = shadow ? (shadowClasses[shadow as unknown as keyof typeof shadowClasses] || "shadow-md") : "shadow-md";

  return (
    <div class={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${finalShadow}`}>
      {image && (
        <div class="w-full h-48 bg-base-200 mb-md">
          <img 
            src={image} 
            alt={title || "Card image"} 
            class="w-full h-full object-cover"
          />
        </div>
      )}
      {title && (
        <h3 class="text-lg font-semibold text-base-content mb-sm">{title}</h3>
      )}
      {content && (
        <p class="text-base-content leading-relaxed">{content}</p>
      )}
    </div>
  );
}
