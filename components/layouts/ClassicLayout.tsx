import Container from "../container/Container.tsx";
import MainMenu, { getHydrationScript as getMenuHydrationScript } from "../navigation/MainMenu.tsx";
import Footer from "../navigation/Footer.tsx";

// 直接定義水合腳本函數
export function getHydrationScript() {
  // 使用命名導入的 getHydrationScript
  console.log('ClassicLayout: 直接調用 getMenuHydrationScript()');
  const hydrationData = getMenuHydrationScript();
  console.log('ClassicLayout: hydrationData type:', typeof hydrationData);
  console.log('ClassicLayout: hydrationData keys:', hydrationData ? Object.keys(hydrationData) : 'null/undefined');
  return hydrationData;
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

