export interface FooterLink {
  text: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: string;
  href: string;
}

export interface FooterProps {
  /** Company logo URL or text */
  logo?: string;
  /** Company name for copyright */
  companyName?: string;
  /** Footer sections with title and links */
  sections: FooterSection[];
  /** Social media links */
  socialLinks?: SocialLink[];
  /** Copyright text */
  copyrightText?: string;
  /** Footer style variant */
  variant?: "default" | "minimal" | "dark" | "centered";
}

export default function Footer({
  logo = "",
  companyName = "",
  sections,
  socialLinks = [],
  copyrightText = "© 2024 Company. All rights reserved.",
  variant = "default",
}: FooterProps) {
  // 使用 UnoCSS 自訂 preset 的 classes
  const baseClasses = "w-full border-t border-base-300";
  
  const variantClasses = {
    default: "bg-base-100 text-base-content",
    minimal: "bg-base-100 text-base-content opacity-80",
    dark: "bg-base-300 text-base-100",
    centered: "bg-base-100 text-base-content text-center",
  };

  const paddingClasses = {
    default: "px-md py-2xl",
    minimal: "px-md py-lg",
    dark: "px-md py-2xl",
    centered: "px-md py-2xl",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[variant]}`;

  const getSocialIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 017 2c9 0 14-9 14-19 0-1.5-.5-3-1.4-4.3a8.5 8.5 0 00-2.3-3.2c-.1-.1-.2-.1-.3-.1z",
      facebook: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
      linkedin: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z",
      github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22",
    };
    return icons[platform] || "";
  };

  return (
    <footer class={classes}>
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Company Info */}
          <div class="col-span-1">
            {logo ? (
              <img src={logo} alt={companyName} class="h-8 w-auto mb-4" />
            ) : companyName ? (
              <h3 class="text-lg font-semibold mb-4">{companyName}</h3>
            ) : null}
            <p class="text-sm">
              Building amazing digital experiences.
            </p>
          </div>

          {/* Footer Sections */}
          {sections.map((section, index) => (
            <div key={index} class="col-span-1">
              <h3 class="text-sm font-semibold mb-4 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul class="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      class="text-sm hover:text-primary-content transition-colors"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div class="col-span-1">
              <h3 class="text-sm font-semibold mb-4 uppercase tracking-wider">
                Follow Us
              </h3>
              <div class="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    class="text-base-content opacity-60 hover:opacity-100 transition-opacity"
                    aria-label={social.platform}
                  >
                    <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d={getSocialIcon(social.platform)} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div class="mt-8 pt-8 border-t border-base-300">
          <p class="text-sm text-center">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
