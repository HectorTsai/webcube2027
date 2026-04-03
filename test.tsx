import { jsx } from "hono/jsx";
import Button from "./components/ui/Button.tsx";
import Drawer from "./components/ui/Drawer.tsx";

export default async function TestPage() {
  // 創建四個方向的 Drawer 元件
  const drawerLeft = await Drawer({
    position: "left",
    size: "320px",
    stateName: "drawerLeftOpen",
    children: [
      jsx('p', { class: "mb-4 text-base-content" }, "這是左側滑出的抽屜（無標題，預設顏色）"),
      jsx(Button, { color: "primary", className: "w-full", onClick: "drawerLeftOpen = false", children: "關閉" })
    ]
  }, null, null);

  const drawerRight1 = await Drawer({
    position: "right", 
    size: "400px",
    stateName: "drawerRight1Open",
    title: "設定面板",
    color: "primary",
    children: [
      jsx('p', { class: "mb-4 text-primary-content" }, "這是第一個右側滑出的抽屜，使用 primary 顏色主題"),
      jsx(Button, { color: "primary", className: "w-full", onClick: "drawerRight1Open = false", children: "關閉" })
    ]
  }, null, null);

  const drawerRight2 = await Drawer({
    position: "right", 
    size: "350px",
    stateName: "drawerRight2Open",
    title: "通知中心",
    color: "secondary",
    children: [
      jsx('p', { class: "mb-4 text-secondary-content" }, "這是第二個右側滑出的抽屜，使用 secondary 顏色主題"),
      jsx(Button, { color: "secondary", className: "w-full", onClick: "drawerRight2Open = false", children: "關閉" })
    ]
  }, null, null);

  const drawerTop = await Drawer({
    position: "top",
    size: 120,
    stateName: "drawerTopOpen",
    title: "頂部通知欄",
    color: "info",
    children: [
      jsx('p', { class: "mb-4 text-info-content" }, "這是上方滑出的抽屜，使用 info 顏色主題，尺寸為數字 120"),
      jsx('p', { class: "mb-2 text-info-content" }, "測試內容 1 - 這是用來測試滾動功能的內容"),
      jsx('p', { class: "mb-2 text-info-content" }, "測試內容 2 - 當內容超過 Drawer 高度時應該出現滾動條"),
      jsx('p', { class: "mb-2 text-info-content" }, "測試內容 3 - 這樣可以確保用戶能看到所有內容"),
      jsx('p', { class: "mb-2 text-info-content" }, "測試內容 4 - 即使 Drawer 尺寸很小"),
      jsx('p', { class: "mb-4 text-info-content" }, "測試內容 5 - 也能正常滾動查看"),
      jsx(Button, { color: "info", className: "w-full", onClick: "drawerTopOpen = false", children: "關閉" })
    ]
  }, null, null);

  const drawerBottom = await Drawer({
    position: "bottom",
    size: "150px",
    stateName: "drawerBottomOpen",
    title: "底部工具欄",
    color: "success",
    children: [
      jsx('p', { class: "mb-4 text-success-content" }, "這是下方滑出的抽屜，使用 success 顏色主題，尺寸為 150px"),
      jsx('p', { class: "mb-2 text-success-content" }, "測試內容 1 - 檢查是否與標題重疊"),
      jsx('p', { class: "mb-2 text-success-content" }, "測試內容 2 - 底部有 pt-6 應該不會重疊"),
      jsx('p', { class: "mb-2 text-success-content" }, "測試內容 3 - 但還是要實際測試確認"),
      jsx('p', { class: "mb-2 text-success-content" }, "測試內容 4 - 滾動時的佈局穩定性"),
      jsx('p', { class: "mb-4 text-success-content" }, "測試內容 5 - 確認內容區域正確"),
      jsx(Button, { color: "success", className: "w-full", onClick: "drawerBottomOpen = false", children: "關閉" })
    ]
  }, null, null);

  return jsx('div', { 
    class: "min-h-screen bg-base-200 p-8",
    'x-data': "{ drawerLeftOpen: false, drawerRight1Open: false, drawerRight2Open: false, drawerTopOpen: false, drawerBottomOpen: false }"
  }, [
    jsx('h1', { class: "text-3xl font-bold mb-8 text-base-content" }, "WebCube Alpine.js 測試"),
    
    jsx('div', { class: "bg-base-100 rounded-lg p-6 shadow-lg mb-8" }, [
      jsx('h2', { class: "text-xl font-semibold mb-4 text-base-content" }, "按鈕測試"),
      
      jsx('div', { class: "flex flex-wrap gap-4 mb-6" }, [
        jsx(Button, { 
          color: "primary", 
          onClick: "drawerRight1Open = !drawerRight1Open",
          children: "開啟抽屜"
        }),
        jsx(Button, { 
          color: "secondary", 
          variant: "outline",
          children: "次要按鈕"
        }),
        jsx(Button, { 
          color: "success", 
          variant: "ghost",
          children: "成功"
        }),
        jsx(Button, { 
          color: "warning", 
          children: "警告"
        }),
        jsx(Button, { 
          color: "error", 
          children: "錯誤"
        })
      ]),
      
      jsx('div', { class: "flex items-center gap-4 mb-6" }, [
        jsx(Button, { size: "xs", color: "accent", children: "XS" }),
        jsx(Button, { size: "sm", color: "accent", children: "SM" }),
        jsx(Button, { size: "md", color: "accent", children: "MD" }),
        jsx(Button, { size: "lg", color: "accent", children: "LG" }),
        jsx(Button, { size: "xl", color: "accent", children: "XL" })
      ]),
      
      jsx('div', { class: "flex gap-4" }, [
        jsx(Button, { rounded: "none", color: "info", children: "無圓角" }),
        jsx(Button, { rounded: "sm", color: "info", children: "小圓角" }),
        jsx(Button, { rounded: "md", color: "info", children: "中圓角" }),
        jsx(Button, { rounded: "lg", color: "info", children: "大圓角" }),
        jsx(Button, { rounded: "full", color: "info", children: "完全圓角" })
      ])
    ]),
    
    jsx('div', { class: "bg-base-100 rounded-lg p-6 shadow-lg mb-8" }, [
      jsx('h2', { class: "text-xl font-semibold mb-4 text-base-content" }, "抽屜方向測試"),
      
      jsx('div', { class: "grid grid-cols-2 gap-4" }, [
        jsx(Button, { 
          color: "primary", 
          onClick: "drawerLeftOpen = !drawerLeftOpen",
          children: "開啟左側抽屜"
        }),
        jsx(Button, { 
          color: "secondary", 
          onClick: "drawerRight1Open = !drawerRight1Open", 
          children: "開啟右側抽屜 #1"
        }),
        jsx(Button, { 
          color: "accent", 
          onClick: "drawerRight2Open = !drawerRight2Open",
          children: "開啟右側抽屜 #2"
        }),
        jsx(Button, { 
          color: "info", 
          onClick: "drawerTopOpen = !drawerTopOpen",
          children: "開啟上方抽屜"
        }),
        jsx(Button, { 
          color: "warning", 
          onClick: "drawerBottomOpen = !drawerBottomOpen",
          children: "開啟下方抽屜"
        }),
        jsx(Button, { 
          color: "error", 
          onClick: "drawerBottomOpen = !drawerBottomOpen",
          children: "測試按鈕"
        })
      ])
    ]),
    
    // 添加所有 Drawer 元件
    drawerLeft,
    drawerRight1,
    drawerRight2,
    drawerTop,
    drawerBottom,
    
    jsx('div', { class: "bg-base-100 rounded-lg p-6 shadow-lg" }, [
      jsx('h2', { class: "text-xl font-semibold mb-4 text-base-content" }, "測試說明"),
      jsx('ul', { class: "list-disc list-inside space-y-2 text-base-content" }, [
        jsx('li', {}, "點擊「開啟抽屜」按鈕測試 Alpine.js 狀態管理"),
        jsx('li', {}, "測試不同顏色、風格、尺寸的按鈕"),
        jsx('li', {}, "驗證 UnoCSS 類別是否正確應用"),
        jsx('li', {}, "檢查 Drawer 開關動畫是否流暢"),
        jsx('li', {}, "點擊背景遮罩關閉 Drawer")
      ])
    ])
  ]);
}
