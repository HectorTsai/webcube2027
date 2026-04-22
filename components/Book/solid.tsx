import type { BookProps } from "./index.tsx";
import { 
  paddingClasses, 
  marginClasses, 
  alignClasses, 
  justifyClasses, 
  gapClasses, 
  roundedClasses 
} from "../classes.ts";

export default function Book({
  children,
  variant = "solid",
  color = "primary",
  width = "800px",
  height = "600px",
  padding = "none",
  margin = "none",
  align = "center",
  justify = "center",
  gap = "md",
  rounded = "md",
  shadow = "md",
  active = false,
  hover = false,
  flipAnimation = true,
  flipSpeed = 1000,
  className = "",
  ...props
}: BookProps) {
  
  // 生成 CSS 類別 - 使用 classes.ts 中定義的正確類別
  const baseClasses = [
    "book-container",
    "box-border",
    `variant-${variant}`,
    `color-${color}`,
    paddingClasses[padding],
    marginClasses[margin],
    alignClasses[align],
    justifyClasses[justify],
    gapClasses[gap],
    roundedClasses[rounded],
    shadow === "none" ? "" : `shadow-${shadow}`,
    active ? "active" : "",
    hover ? "hover" : "",
    className,
  ].filter(Boolean).join(" ");

  // 簡單直接的 page-flip 實現
  const xDataScript = `{
    pageFlip: null,
    init() {
      var bookElement = this.$el;
      if (!bookElement) return;
      // 防止重複初始化
      if (this.initialized) return;
      this.initialized = true;
      
      console.log('開始初始化 Book 組件');

      // 監聽窗口大小變化
      const ro = new ResizeObserver(entries => {
        const entry = entries[0];
        // 現代瀏覽器支援 contentBoxSize
        const w = entry.contentBoxSize[0].inlineSize;
        const h = entry.contentBoxSize[0].blockSize;
        if(this.pageFlip && this.handleResize){
          console.log('窗口大小變化，更新 PageFlip',w,h);
          //this.handleResize(w, h);
        }
      });

      ro.observe(bookElement);
      
      // 初始化 page-flip
      if (${flipAnimation}) {
        // 等待 page-flip 庫加載
        const waitForLibrary = (retryCount = 0) => {
          if (retryCount >= 10) {
            console.warn('PageFlip library not found after 10 attempts');
            return;
          }
          
          if (globalThis.St && globalThis.St.PageFlip) {
            console.log('PageFlip library loaded, initializing...');
            setTimeout(() => {
              const style = window.getComputedStyle(bookElement);
              const initW = parseFloat(style.width) - (parseFloat(style.paddingLeft) + parseFloat(style.paddingRight));
              const initH = parseFloat(style.height) - (parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
              this.initPageFlip(initW, initH);
            }, 100);
          } else {
            console.log('Waiting for PageFlip library... attempt', retryCount + 1);
            setTimeout(() => {
              waitForLibrary(retryCount + 1);
            }, 200);
          }
        };
        
        waitForLibrary();
      }
    },
    initPageFlip(width, height) {
      const bookElement = this.$el;
      if (!bookElement) return;

      try {
        const singleMode = width < 600;

        this.pageFlip = new globalThis.St.PageFlip(bookElement, {
          width: singleMode ? width : width / 2,
          height: height,
//          minWidth: singleMode ? width - 10 : 100,
//          minHeight: singleMode ? height - 10 : 100,
//          maxWidth: width,
//          maxHeight: "800px",
          maxShadowOpacity: 0.5,
          swipeGap: singleMode ? 10 : 20,
          size: "fixed",
          showCover: true,
          disableFlipByClick: true,
          usePortrait: singleMode,
          autoSize:false,
        });
        console.log('Resize handled:', { 
          width: width, 
          height: height, 
          singleMode 
        });

        this.pageFlip.loadFromHTML(document.querySelectorAll('.book-page'));
      } catch (error) {
        console.error('Error initializing PageFlip:', error);
      }
    },
    handleResize(width, height) {
      if (!this.pageFlip) return;

      const singleMode = width < 600;
      
      try {
        const settings = this.pageFlip.getSettings();
        
        settings.width = singleMode ? width : width / 2;
        settings.height = "800px";
//        settings.minWidth = singleMode ? width - 10 : 100;
//        settings.minHeight = singleMode ? height - 10 : 100;
//        settings.maxWidth = width;
//        settings.maxHeight = height;
        
        this.pageFlip.update();
        this.pageFlip.updateOrientation(singleMode ? "portrait" : "landscape");
        
        console.log('Resize handled:', { 
          width: settings.width, 
          height: settings.height, 
          singleMode 
        });
      } catch (error) {
        console.error('Error handling resize:', error);
      }
    }
  }`;

  return (
    <div class="p-4">
    <div
      class={`${baseClasses} relative overflow-hidden`}
      style={{
        width: width === "full" ? "100%" : width,
        height: height === "full" ? "100vh" : height,
      }}
      x-data={xDataScript}
      {...props}
    >
      {/* 書本內容容器 - 用於 page-flip 初始化 */}
      <div class="book-content" x-init="init()">
        {children}
      </div>
    </div>
    </div>
  );
}