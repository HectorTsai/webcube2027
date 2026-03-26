import Container from "../container/Container.tsx";
import MainMenu, { MenuItem, CtaButton } from "../navigation/MainMenu.tsx";
import Footer, { FooterSection, SocialLink } from "../navigation/Footer.tsx";

export interface ClassicLayoutProps {
  /** Child elements to render inside the layout */
  children: any;
  /** Menu items for navigation */
  menuItems?: MenuItem[];
  /** Call-to-action button for navigation */
  ctaButton?: CtaButton;
  /** Footer sections */
  footerSections?: FooterSection[];
  /** Social links for footer */
  socialLinks?: SocialLink[];
  /** Company name for footer */
  companyName?: string;
}

export default function ClassicLayout({ 
  children,
  menuItems = [],
  ctaButton,
  footerSections = [],
  socialLinks = [],
  companyName = "WebCube 2027"
}: ClassicLayoutProps) {
  return (
    <Container 
      direction="column" 
      width="full"
    >
      {/* Header with Navigation */}
      <MainMenu 
        logoText="WebCube"
        menuItems={menuItems}
        ctaButton={ctaButton}
        variant="default"
      />
      
      {/* Main Content Area */}
      <Container 
        direction="column" 
        padding="lg"
      >
        {children}
      </Container>
      
      {/* Footer */}
      <Footer 
        companyName={companyName}
        sections={footerSections}
        socialLinks={socialLinks}
        variant="default"
      />
    </Container>
  );
}
