# 佈局組件

## 🎯 職責範圍
- 定義網站全局結構
- 接收 `children` 作為頁面內容
- 包含 Header、Main、Footer 等固定區域

## 📋 可用組件類型
- **網站佈局** (Header + Main + Footer)
- **管理後台佈局** (Sidebar + Main)
- **簡約佈局** (只有 Main)
- **登入頁面佈局** (居中卡片)

## 🚨 重要規則
- **必須接收 `children` prop**
- **使用 Container 組件**
- **不包含業務邏輯**
- **保持純淨，專注於結構**

## 📝 範例模板
```tsx
export default function ClassicLayout({ children }: { children: any }) {
  return (
    <Container direction="column" width="full">
      <MainMenu />
      <Container padding="lg">
        {children}
      </Container>
      <Footer />
    </Container>
  );
}
```

## 🎨 樣式指南
- 使用 UnoCSS classes
- 響應式設計
- 保持一致的間距
- 考慮載入狀態

## 📦 相依組件
- `Container` - 佈局容器
- `MainMenu` - 主選單
- `Footer` - 頁尾
