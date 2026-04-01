import { InnerAPI } from "../../services/index.ts";
import Icon from "../ui/Icon.tsx";
import Drawer from "../ui/Drawer.tsx";
import { Context } from "hono";
import { useRef } from "hono/jsx";

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
  const drawerRef = useRef(null);

  // 使用 UnoCSS 自訂 preset 的 classes - 固定 sticky
  const classes = "w-full border-b border-base-300 bg-primary text-primary-content sticky top-0 z-50 px-md py-md";

  return (
    <>
      <nav class={classes}>
        {/* 系統選單 Drawer - 由 logo 按鈕觸發 */}
        <Drawer id="system-menu-drawer" position="left" defaultOpen={false}>
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
        <Drawer ref={drawerRef} id="main-menu-drawer" position="right" defaultOpen={false}>
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
    component: function() {
      // 全域函數：切換指定 Drawer
      globalThis.toggleMainMenuDrawer = function(drawerId) {
        const drawer = document.getElementById(drawerId);
        if (drawer) {
          // 確保 toggle 方法可用
          if (!drawer.toggle) {
            drawer.toggle = function() {
              // 自動檢測 Drawer 位置
              const isLeftDrawer = this.classList.contains('left-0');
              const isRightDrawer = this.classList.contains('right-0');
              const isTopDrawer = this.classList.contains('top-0');
              const isBottomDrawer = this.classList.contains('bottom-0');
              
              let isOpen;
              if (isLeftDrawer) {
                isOpen = this.classList.contains('-translate-x-full');
              } else if (isRightDrawer) {
                isOpen = this.classList.contains('translate-x-full');
              } else if (isTopDrawer) {
                isOpen = this.classList.contains('-translate-y-full');
              } else if (isBottomDrawer) {
                isOpen = this.classList.contains('translate-y-full');
              } else {
                isOpen = this.classList.contains('-translate-x-full'); // 預設左邊
              }
              
              if (isOpen) {
                // 開啟 Drawer
                if (isLeftDrawer) {
                  this.classList.remove('-translate-x-full', 'animate-out', 'slide-out-to-left');
                  this.classList.add('translate-x-0', 'animate-in', 'slide-in-from-left');
                } else if (isRightDrawer) {
                  this.classList.remove('translate-x-full', 'animate-out', 'slide-out-to-right');
                  this.classList.add('translate-x-0', 'animate-in', 'slide-in-from-right');
                } else if (isTopDrawer) {
                  this.classList.remove('-translate-y-full', 'animate-out', 'slide-out-to-top');
                  this.classList.add('translate-y-0', 'animate-in', 'slide-in-from-top');
                } else if (isBottomDrawer) {
                  this.classList.remove('-translate-y-full', 'animate-out', 'slide-out-to-bottom');
                  this.classList.add('translate-y-0', 'animate-in', 'slide-in-from-bottom');
                }
              } else {
                // 關閉 Drawer
                if (isLeftDrawer) {
                  this.classList.remove('translate-x-0', 'animate-in', 'slide-in-from-left');
                  this.classList.add('-translate-x-full', 'animate-out', 'slide-out-to-left');
                } else if (isRightDrawer) {
                  this.classList.remove('translate-x-0', 'animate-in', 'slide-in-from-right');
                  this.classList.add('translate-x-full', 'animate-out', 'slide-out-to-right');
                } else if (isTopDrawer) {
                  this.classList.remove('translate-y-0', 'animate-in', 'slide-in-from-top');
                  this.classList.add('-translate-y-full', 'animate-out', 'slide-out-to-top');
                } else if (isBottomDrawer) {
                  this.classList.remove('translate-y-0', 'animate-in', 'slide-in-from-bottom');
                  this.classList.add('-translate-y-full', 'animate-out', 'slide-out-to-bottom');
                }
              }
              
              // 切換 overlay
              const overlayId = this.id + '-overlay';
              const overlay = document.getElementById(overlayId);
              if (overlay) {
                overlay.style.display = isOpen ? 'block' : 'none';
              }
            };
          }
          
          drawer.toggle();
        }
      };
      
      // 也賦值給 window 以確保相容性
      if (typeof window !== 'undefined') {
        window.toggleMainMenuDrawer = globalThis.toggleMainMenuDrawer;
      }
    },
    initCode: `
      // 執行 HydrationComponent 來定義全域函數
      HydrationComponent();
      
      // 立即覆蓋所有 overlay 和關閉按鈕的事件
      function setupDrawerEvents() {
        const overlays = document.querySelectorAll('[id$="-overlay"]');
        overlays.forEach(overlay => {
          const drawerId = overlay.id.replace('-overlay', '');
          // 移除原來的 onclick
          overlay.removeAttribute('onclick');
          overlay.addEventListener('click', function() {
            globalThis.toggleMainMenuDrawer(drawerId);
          });
        });
        
        // 覆蓋 Drawer 內建的關閉按鈕
        const closeButtons = document.querySelectorAll('button[aria-label="關閉抽屜"]');
        closeButtons.forEach(button => {
          const drawerId = button.closest('[id^="drawer-"]')?.id;
          if (drawerId) {
            button.removeAttribute('onclick');
            button.addEventListener('click', function() {
              globalThis.toggleMainMenuDrawer(drawerId);
            });
          }
        });
      }
      
      // 立即設置事件
      setupDrawerEvents();
    `
  };
}

