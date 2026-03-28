export interface MenuItem {
  label: string;
  href: string;
}

export interface CtaButton {
  text: string;
  href: string;
  variant?: "primary" | "secondary";
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
  const baseClasses = "w-full border-b border-base-300 bg-base-100";
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
            <img src={logo} alt={logoText} class="h-8 w-auto" />
          ) : (
            <span class="text-xl font-bold text-base-content">{logoText}</span>
          )}
        </div>

        {/* Menu Items */}
        <div class="hidden md:flex items-center gap-md">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              class="text-base-content hover:text-primary-content px-sm py-sm text-sm font-medium transition-colors"
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
              class={`btn ${ctaButton.variant === "secondary" ? "btn-secondary" : "btn-primary"}`}
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
