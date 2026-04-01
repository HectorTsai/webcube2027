import Container from "../container/Container.tsx";
import MainMenu from "../navigation/MainMenu.tsx";
import Footer from "../navigation/Footer.tsx";

// 直接定義水合腳本函數
export async function getHydrationScript() {
  // 從 MainMenu 導入水合腳本
  const MainMenu = await import("../navigation/MainMenu.tsx");
  return MainMenu.getHydrationScript();
}

export interface ClassicLayoutProps {
  /** Child elements to render inside the layout */
  children: any;
  /** Hono context for API calls */
  context?: any;
}

export default function ClassicLayout({ 
  children,
  context
}: ClassicLayoutProps) {
    return (
    <Container 
      direction="column" 
      width="full"
      padding="none"
      className="min-h-screen flex flex-col"
    >
      {/* Header with Navigation */}
      <MainMenu context={context} />
      
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
        context={context}
      />
    </Container>
  );
}

