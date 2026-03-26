# 導航組件

## 🎯 職責範圍
- 導航相關方塊
- 有狀態管理
- 使用者互動

## 📋 可用組件類型
- **主選單** (MainMenu) - 網站主要導航
- **麵包屑** (Breadcrumb) - 頁面路徑導航
- **側邊欄** (Sidebar) - 側邊導航選單
- **分頁** (Tabs) - 內容分頁切換
- **下拉選單** (Dropdown) - 選項下拉選單
- **手機選單** (MobileMenu) - 響應式選單

## 🎨 樣式規範
- 使用 UnoCSS classes
- 響應式設計
- 互動狀態
- 一致的導航模式

## 📝 範例模板
```tsx
interface MenuItem {
  title: string;
  href: string;
  active?: boolean;
  children?: MenuItem[];
}

interface MainMenuProps {
  logo?: string;
  items: MenuItem[];
  ctaButton?: {
    text: string;
    href: string;
  };
}

export default function MainMenu({ logo, items, ctaButton }: MainMenuProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-base-100 shadow-sm">
      <Container className="flex items-center justify-between py-4">
        {/* Logo */}
        {logo && (
          <a href="/" className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="h-8 w-8" />
            <span className="font-bold text-xl">WebCube</span>
          </a>
        )}
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-base-content hover:text-primary ${
                item.active ? 'text-primary font-semibold' : ''
              }`}
            >
              {item.title}
            </a>
          ))}
          
          {ctaButton && (
            <Button variant="primary" size="sm">
              {ctaButton.text}
            </Button>
          )}
        </div>
        
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      </Container>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-base-300">
          <Container className="py-4">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-base-content hover:text-primary"
              >
                {item.title}
              </a>
            ))}
            
            {ctaButton && (
              <Button variant="primary" className="w-full mt-4">
                {ctaButton.text}
              </Button>
            )}
          </Container>
        </div>
      )}
    </nav>
  );
}
```

## 🚨 重要規則
- **狀態管理** - 處理互動狀態
- **可訪問性** - 支援鍵盤導航
- **響應式** - 桌面和手機不同呈現
- **SEO 友善** - 語意化 HTML 結構

## 📦 相依組件
- `Container` - 佈局容器
- `Button` - 按鈕
- 可能需要 useState (React Hook)
