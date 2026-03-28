import Container from "../container/Container.tsx";
import MainMenu, { MenuItem, CtaButton } from "../navigation/MainMenu.tsx";
import Footer from "../navigation/Footer.tsx";

export interface ClassicLayoutProps {
  /** Child elements to render inside the layout */
  children: any;
  /** Menu items for navigation */
  menuItems?: MenuItem[];
  /** Call-to-action button for navigation */
  ctaButton?: CtaButton;
  /** Company name for footer */
  companyName?: string;
  /** Company website URL for footer */
  companyUrl?: string;
  /** Current year for footer */
  year?: number;
  /** Company logo for footer */
  logo?: string;
  /** Current language for display */
  language?: string;
}

export default function ClassicLayout({ 
  children,
  menuItems = [],
  ctaButton,
  companyName = "WebCube 2027",
  companyUrl = "",
  year = new Date().getFullYear(),
  logo = "",
  language
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
        language={language}
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
        companyUrl={companyUrl}
        year={year}
        logo={logo}
        language={language}
      />
    </Container>
  );
}

