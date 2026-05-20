import { Context } from 'hono';
import Card from "../components/Card/index.tsx";

export default function TestIndex(ctx: Context) {
  const testPages = [
    { name: "動態方塊測試器", path: "/test/cube" },
    { name: "Span 測試", path: "/test/span" },
    { name: "Swap 測試", path: "/test/swap" },
    { name: "Toggle 測試", path: "/test/toggle" },
    { name: "Avatar 測試", path: "/test/avatar" },
    { name: "Button 測試", path: "/test/button" },
    { name: "Container 測試", path: "/test/container" },
    { name: "Card 測試", path: "/test/card" },
    { name: "Hero 測試", path: "/test/hero" },
    { name: "List 測試", path: "/test/list" },
    { name: "Divider 測試", path: "/test/divider" },
    { name: "Icon 測試", path: "/test/icon" },
    { name: "Image 測試", path: "/test/image" },
    { name: "Select 測試", path: "/test/select" },
    { name: "Modal 測試", path: "/test/modal" },
    { name: "Drawer 測試", path: "/test/drawer" },
    { name: "Footer 測試", path: "/test/footer" },
    { name: "MenuBar 測試", path: "/test/menu-bar" },
    { name: "Steps 測試", path: "/test/steps" },
    { name: "Timeline 測試", path: "/test/timeline" },
    { name: "Calendar 測試", path: "/test/calendar" },
    { name: "Input 測試", path: "/test/input" },
    { name: "InputField 測試", path: "/test/input-field" },
    { name: "Book 測試", path: "/test/book" },
    { name: "Popup 測試", path: "/test/popup" },
    { name: "OptionPicker 測試", path: "/test/option-picker" },
    { name: "DateTimePicker 測試", path: "/test/date-time-picker" },
  ];

  const uiComponents = testPages.filter(p => 
    ["Avatar", "Button", "Container", "Card", "Hero", "List", "Divider", "Icon", "Image", "Span"].some(c => p.name.includes(c))
  );
  
  const layoutComponents = testPages.filter(p =>
    ["Modal", "Drawer", "Footer", "MenuBar", "Book", "Popup"].some(c => p.name.includes(c))  
  );
  
  const interactiveComponents = testPages.filter(p =>
    ["Swap", "Toggle", "Steps", "Timeline", "Calendar", "Input", "InputField", "Select", "OptionPicker", "DateTimePicker"].some(c => p.name.includes(c))
  );
  const dunamicComponents = testPages.filter(p => 
    ["動態方塊"].some(c => p.name.includes(c))
  );
  return (
    <div class="p-8 max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-center">測試頁面列表</h1>

      <Card className="mb-6" padding="lg" variant="outline">
        <h2 class="text-xl font-semibold mb-4">動態方塊JSX解析器</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dunamicComponents.map(page => (
            <a 
              key={page.path}
              href={page.path}
              class="btn btn-primary text-primary-content text-center"
            >
              {page.name}
            </a>
          ))}
        </div>
      </Card>

      <Card className="mb-6" padding="lg" variant="outline">
        <h2 class="text-xl font-semibold mb-4">UI 組件</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uiComponents.map(page => (
            <a 
              key={page.path}
              href={page.path}
              class="btn btn-primary text-primary-content text-center"
            >
              {page.name}
            </a>
          ))}
        </div>
      </Card>

      <Card className="mb-6" padding="lg" variant="outline" color="accent">
        <h2 class="text-xl font-semibold mb-4">佈局組件</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {layoutComponents.map(page => (
            <a 
              key={page.path}
              href={page.path}
              class="btn btn-accent text-accent-content text-center"
            >
                {page.name}
            </a>
          ))}
        </div>
      </Card>

      <Card className="mb-6" padding="lg" variant="outline" color="warning">
        <h2 class="text-xl font-semibold mb-4">互動組件</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interactiveComponents.map(page => (
            <a 
              key={page.path}
              href={page.path}
              class="btn btn-warning text-warning-content text-center"
            >
                {page.name}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
