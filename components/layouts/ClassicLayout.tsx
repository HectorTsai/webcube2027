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
  /** Site name for header */
  siteName?: string;
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
  siteName = "WebCube",
  language
}: ClassicLayoutProps) {
    return (
    <Container 
      direction="column" 
      width="full"
      padding="none"
      className="min-h-screen flex flex-col"
    >
      {/* Header with Navigation */}
      <MainMenu 
        logo={logo}
        logoText={siteName}
        menuItems={menuItems}
        ctaButton={ctaButton}
        variant="default"
        language={language}
      />
      
      {/* Main Content Area */}
      <Container 
        direction="column" 
        padding="lg"
        className="flex-1 overflow-y-auto"
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

