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
  const baseClasses = "card rounded-lg overflow-hidden";
  
  const variantClasses = {
    default: "border border-base-300",
    outlined: "border-2 border-base-300",
    elevated: "shadow-lg",
  };
  
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const shadowClasses = shadow && variant !== "elevated" ? "shadow-md" : "";

  return (
    <div class={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${shadowClasses}`}>
      {image && (
        <div class="w-full h-48 bg-gray-200 mb-4">
          <img 
            src={image} 
            alt={title || "Card image"} 
            class="w-full h-full object-cover"
          />
        </div>
      )}
      {title && (
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      )}
      {content && (
        <p class="text-gray-600 leading-relaxed">{content}</p>
      )}
    </div>
  );
}
