import { InnerAPI } from "../../services/index.ts";
import Icon from "../ui/Icon.tsx";
import Drawer from "../ui/Drawer.tsx";
import { Context } from "hono";
import { useRef, useEffect } from 'hono/jsx/dom';

interface MenuItem {
  label: string;
  href: string;
}

interface CtaButton {
  text: string;
  href: string;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
}

export default async function MainMenu({ context }: { context?: Context }) {
  // 從 API 取得網站資訊
  let logo = "圖示:圖示:web_cube";
  let logoText = "WebCube2027";
  let menuButton = "圖示:圖示:menu";
  let menuItems: MenuItem[] = [];
  let ctaButton: CtaButton | undefined;
  
  if (context) {
    try {
      const response1 = await InnerAPI(context, "/api/v1/skeleton");
      const response2 = await InnerAPI(context, "/api/v1/info");
      const skeleton = await response1.json();
      const info = await response2.json();
      
      // 取得基本資訊
      logo = info.data?.商標 || "圖示:圖示:web_cube";
      logoText = info.data?.名稱 || "Brand";
      menuButton = skeleton?.選單按鈕 || "圖示:圖示:menu2";
            
      // 處理主選單
      if (info.data?.主選單) {
        for (const 頁面ID of info.data.主選單) {
          try {
            const 頁面Response = await InnerAPI(context, `/api/v1/cube/${頁面ID}`);
            const 頁面資料 = await 頁面Response.json();
            menuItems.push({
              label: 頁面資料.data?.標題 || "",
              href: 頁面資料.data?.路徑 || "/"
            });
          } catch (_err) {
            // 忽略單個頁面錯誤
          }
        }
      }
      
      // 處理 CTA 按鈕
      if (info.data?.CTA按鈕) {
        ctaButton = {
          text: info.data.CTA按鈕.文字 || "Get Started",
          href: info.data.CTA按鈕.連結 || "#",
          variant: info.data.CTA按鈕.變體 || "primary"
        };
      }
    } catch (_error) {
      // API 失敗時使用預設值
    }
  }
  
  // 使用 useRef 引用 Drawer 組件
  const systemDrawerRef = useRef(null);
  const mainDrawerRef = useRef(null);

  // 暴露 ref 到 globalThis，讓水合腳本可以訪問
  useEffect(() => {
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).systemDrawerRef = systemDrawerRef;
      (globalThis as any).mainDrawerRef = mainDrawerRef;
    }
  }, [systemDrawerRef, mainDrawerRef]);

  // 使用 UnoCSS 自訂 preset 的 classes - 固定 sticky
  const classes = "w-full border-b border-base-300 bg-primary text-primary-content sticky top-0 z-50 px-md py-md";

  return (
    <>
      <nav class={classes}>
        {/* 系統選單 Drawer - 由 logo 按鈕觸發 */}
        <Drawer id="system-menu-drawer" ref={systemDrawerRef} position="left" defaultOpen={false}>
          <div class="p-4">
            <h3 class="text-lg font-bold mb-4">系統選單</h3>
            <div class="text-xs text-gray-500 mb-2">
              這是系統選單
            </div>
            <a href="/" class="block py-2 px-4 hover:bg-base-200 rounded">首頁</a>
            <a href="/settings" class="block py-2 px-4 hover:bg-base-200 rounded">設定</a>
            <a href="/about" class="block py-2 px-4 hover:bg-base-200 rounded">關於</a>
          </div>
        </Drawer>
        
        {/* 主選單 Drawer - 由選單按鈕觸發 */}
        <Drawer ref={mainDrawerRef} id="main-menu-drawer" position="right" defaultOpen={false}>
          <div class="p-4">
            <h3 class="text-lg font-bold mb-4">主選單</h3>
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                class="block py-2 px-4 hover:bg-base-200 rounded"
              >
                {item.label}
              </a>
            ))}
            {ctaButton && (
              <a
                href={ctaButton.href}
                class={`btn btn-${ctaButton.variant || "primary"} mt-4 w-full`}
              >
                {ctaButton.text}
              </a>
            )}
          </div>
        </Drawer>
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div class="flex items-center">
            <button 
              type="button"
              class="btn btn-ghost flex items-center"
              onclick="toggleMainMenuDrawer('system-menu-drawer')"
            >
              {logo ? (
                <Icon id={logo} context={context} className="w-8" />
              ) : (
                ""
              )}
              <span class="text-xl">{logoText}</span>
            </button>
          </div>

          {/* Menu Items */}
          <div class="hidden md:flex items-center gap-md">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                class="btn btn-ghost text-primary-content no-underline hover:btn-secondary"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          {ctaButton && (
            <div class="flex items-center">
              <a
                href={ctaButton.href}
                class={`btn ${ctaButton.variant === "secondary" ? "btn-secondary" : ctaButton.variant === "accent" ? "btn-accent" : "btn-primary"} ${ctaButton.size === "sm" ? "text-sm" : ctaButton.size === "lg" ? "text-lg" : "text-md"} no-underline`}
              >
                {ctaButton.text}
              </a>
            </div>
          )}

          {/* Mobile menu button (simplified) */}
          <div class="md:hidden">
            <button 
              type="button" 
              class="btn btn-ghost p-1 hover:bg-secondary hover:text-secondary-content"
              onclick="toggleMainMenuDrawer('main-menu-drawer')"
            >
              <Icon id={menuButton} context={context} className="w-6" />
            </button>
          </div>
        </div>
      </nav>
      
          </>
  );
}

// 水合功能 - 提供客戶端交互能力 (原本的工作結構)
export function getHydrationScript() {
  return {
    imports: [],
    component: function(drawerId) {
      console.log('toggleMainMenuDrawer called:', drawerId);
    },
    initCode: `
      // 完整的實作邏輯
      globalThis.toggleMainMenuDrawer = function(drawerId) {
        const drawer = document.getElementById(drawerId);
        if (drawer) {
          // 在 SSR 環境中，只能使用手動 DOM 操作
          console.log('使用手動 DOM 操作');
          
          // 檢查當前狀態
          const isOpen = !drawer.classList.contains('-translate-x-full') && 
                         !drawer.classList.contains('translate-x-full') &&
                         !drawer.classList.contains('-translate-y-full') && 
                         !drawer.classList.contains('translate-y-full');
          
          if (isOpen) {
            // 關閉 Drawer
            drawer.classList.remove('translate-x-0', 'translate-y-0');
            if (drawer.classList.contains('left-0')) {
              drawer.classList.add('-translate-x-full');
            } else if (drawer.classList.contains('right-0')) {
              drawer.classList.add('translate-x-full');
            } else if (drawer.classList.contains('top-0')) {
              drawer.classList.add('-translate-y-full');
            } else if (drawer.classList.contains('bottom-0')) {
              drawer.classList.add('translate-y-full');
            }
          } else {
            // 開啟 Drawer
            drawer.classList.remove('-translate-x-full', 'translate-x-full', '-translate-y-full', 'translate-y-full');
            drawer.classList.remove('animate-in', 'animate-out', 'slide-in-from-left', 'slide-in-from-right', 'slide-in-from-top', 'slide-in-from-bottom');
            drawer.classList.remove('slide-out-to-left', 'slide-out-to-right', 'slide-out-to-top', 'slide-out-to-bottom');
            drawer.classList.add('translate-x-0', 'translate-y-0');
          }
          
          // 切換 overlay
          const overlay = document.getElementById(drawerId + '-overlay');
          if (overlay) {
            overlay.style.display = isOpen ? 'none' : 'block';
          }
        }
      };
      
      // 同時定義到 window
      if (typeof window !== 'undefined') {
        window.toggleMainMenuDrawer = globalThis.toggleMainMenuDrawer;
      }
      
      // 設置事件監聽器
      function setupDrawerEvents() {
        const overlays = document.querySelectorAll('[id$="-overlay"]');
        overlays.forEach(overlay => {
          const drawerId = overlay.id.replace('-overlay', '');
          overlay.removeAttribute('onclick');
          overlay.addEventListener('click', function() {
            globalThis.toggleMainMenuDrawer(drawerId);
          });
        });
        
        const closeButtons = document.querySelectorAll('button[aria-label="關閉抽屜"]');
        closeButtons.forEach(button => {
          const drawerContainer = button.closest('[id$="-drawer"]');
          const drawerId = drawerContainer?.id;
          if (drawerId) {
            button.removeAttribute('onclick');
            button.addEventListener('click', function() {
              globalThis.toggleMainMenuDrawer(drawerId);
            });
          }
        });
      }
      
      // 立即執行
      setupDrawerEvents();
    `
  };
}

