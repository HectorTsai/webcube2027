# 容器組件

## 🎯 職責範圍
- 純佈局輔助組件
- 提供結構性框架
- 不包含業務邏輯

## 📋 可用組件類型
- **網格** (Grid) - CSS Grid 佈局
- **區塊** (Section) - 頁面區塊容器
- **包裝器** (Wrapper) - 內容包裝
- **分隔線** (Divider) - 視覺分隔
- **間距** (Spacer) - 空白間距

## 🎨 樣式規範
- 使用 UnoCSS classes
- 彈性佈局系統
- 響應式斷點
- 一致的間距系統

## 📝 範例模板
```tsx
export interface ContainerProps {
  children: any;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  width?: "auto" | "full" | "fit" | "screen";
}

export default function Container({
  children,
  direction = "column",
  align = "stretch",
  justify = "start",
  gap = "md",
  padding = "md",
  width = "full",
}: ContainerProps) {
  const baseClasses = "flex";
  
  const directionClasses = {
    row: "flex-row",
    column: "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse",
  };
  
  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };
  
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };
  
  const gapClasses = {
    none: "",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };
  
  const paddingClasses = {
    none: "",
    xs: "p-2",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-12",
  };
  
  const widthClasses = {
    auto: "w-auto",
    full: "w-full",
    fit: "w-fit",
    screen: "w-screen",
  };
  
  return (
    <div className={`
      ${baseClasses}
      ${directionClasses[direction]}
      ${alignClasses[align]}
      ${justifyClasses[justify]}
      ${gapClasses[gap]}
      ${paddingClasses[padding]}
      ${widthClasses[width]}
    `}>
      {children}
    </div>
  );
}
```

## 🚨 重要規則
- **純佈局** - 不包含樣式邏輯
- **高度可重用** - 支援多種配置
- **語意化** - 使用有意義的 prop 名稱
- **效能優先** - 簡單的 CSS 類別

## 📦 相依組件
- 無外部相依，純 CSS 佈局
