import Icon from "../ui/Icon.tsx";

export interface MenuItem {
  label: string;
  href: string;
}

export interface CtaButton {
  text: string;
  href: string;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
}

export interface MainMenuProps {
  /** Logo image URL or text */
  logo?: string;
  /** Logo text alternative to image */
  logoText?: string;
  /** Array of menu items with label and href */
  menuItems: MenuItem[];
  /** Call-to-action button configuration */
  ctaButton?: CtaButton;
  /** Menu style variant */
  variant?: "default" | "minimal" | "centered" | "split";
  /** Whether menu should stick to top when scrolling */
  sticky?: boolean;
  /** Language for multilingual support */
  language?: string;
}

export default function MainMenu({
  logo = "",
  logoText = "Brand",
  menuItems,
  ctaButton,
  variant = "default",
  sticky = false,
  language = "zh-tw",
}: MainMenuProps) {
  // 使用 UnoCSS 自訂 preset 的 classes
  const baseClasses = "w-full border-b border-base-300 bg-primary text-primary-content";
  const stickyClasses = sticky ? "sticky top-0 z-50" : "";
  
  const variantClasses = {
    default: "px-md py-md",
    minimal: "px-md py-sm",
    centered: "px-md py-md text-center",
    split: "px-md py-md",
  };

  const classes = `${baseClasses} ${stickyClasses} ${variantClasses[variant]}`;

  return (
    <nav class={classes}>
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div class="flex items-center">
          {logo ? (
            <Icon id={logo} size="xl" />
          ) : (
            ""
          )}
          <span class="text-xl">{logoText}</span>
        </div>

        {/* Menu Items */}
        <div class="hidden md:flex items-center gap-md">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              class="btn btn-ghost text-primary-content no-underline hover:btn-secondary"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        {ctaButton && (
          <div class="flex items-center">
            <a
              href={ctaButton.href}
              class={`btn ${ctaButton.variant === "secondary" ? "btn-secondary" : ctaButton.variant === "accent" ? "btn-accent" : "btn-primary"} ${ctaButton.size === "sm" ? "text-sm" : ctaButton.size === "lg" ? "text-lg" : "text-md"} no-underline`}
            >
              {ctaButton.text}
            </a>
          </div>
        )}

        {/* Mobile menu button (simplified) */}
        <div class="md:hidden">
          <button type="button" class="text-base-content hover:text-primary-content p-2">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
