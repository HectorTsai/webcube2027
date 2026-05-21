import { Children, cloneElement } from 'hono/jsx';
import type { BookProps } from "./index.tsx";
import Page from "./Page.tsx";
import Cover from "./Cover.tsx";
import Foot from "./Foot.tsx";
import { paddingClasses, marginClasses, } from "../classes.ts";
import { processChildren } from "../index.ts";

export default async function Book({
  children,
  variant = "solid",
  color = "base",
  width = "full",
  height = "full",
  padding = "sm",
  margin = "none",
  className = "",
  context,
  ...props
}: BookProps) {
  // 簡單直接的 page-flip 實現
  const xDataScript = `{
    pageFlip: null,
    init() {
      var observeElement = document.querySelector(".book-container");
      const bookElement = this.$el;
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
          this.handleResize(w, h);
        }
      });

      ro.observe(observeElement);
      
      // 初始化 page-flip
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
    },
    initPageFlip(width, height) {
      const bookElement = this.$el;
      if (!bookElement) return;

      try {
        const singleMode = height>width;

        this.pageFlip = new globalThis.St.PageFlip(bookElement, {
          width: singleMode ? width : width / 2,
          height: height,
          minWidth: singleMode ? width - 10 : 100,
          minHeight: singleMode ? height - 10 : 100,
          maxWidth: singleMode ? width : width / 2,
          maxHeight: height,
          maxShadowOpacity: 0.5,
          swipeGap: singleMode ? 10 : 30,
          size: "stretch",
          showCover: true,
          clickEventForward: true,
          disableFlipByClick: true,
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

        const singleMode = height>width;
      
      try {
        const settings = this.pageFlip.getSettings();
        
        settings.width = singleMode ? width : width / 2;
        settings.height = height;
        settings.minWidth = singleMode ? width - 10 : 100;
        settings.minHeight = singleMode ? height - 10 : 100;
        settings.maxWidth = singleMode ? width : width / 2;
        settings.maxHeight = height;
        settings.mode = singleMode ? "portrait" : "landscape";

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
  // 生成 CSS 類別 - 使用 classes.ts 中定義的正確類別
  const bookClasses = [
    "book-container",
    "box-border",
    "overflow-hidden",
    paddingClasses[padding],
    marginClasses[margin],
    className,
  ].filter(Boolean).join(" ");
  
  // 使用 processChildren 處理子元件，並利用 extraPropsFn 處理 Book 特定的邏輯
  let pageCounter = 0;
  const processedChildren = processChildren(
    children,
    { color, variant, context },
    (child: any, index: number) => {
      const extraProps: Record<string, any> = {};
      // 只有 Page、Cover、Foot 元件需要額外處理
      const isBookComponent = child?.type === Page || child?.type === Cover || child?.type === Foot;
      if (isBookComponent && child.type === Page) {
        extraProps.pageNumber = ++pageCounter;
        extraProps.odd = pageCounter % 2 !== 0;
      }
      return extraProps;
    }
  );
  
  return (
    <div class={bookClasses} style={{
        width: width === "full" ? "100%" : width,
        height: height === "full" ? "100vh" : height,
    }} {...props}>
      <div class="w-full h-full" x-data={xDataScript}>
        {/* 書本內容容器 - 用於 page-flip 初始化 */}
        <div class="book-content hidden" x-init="init()">
          {processedChildren}
        </div>
      </div>
    </div>
  );
}
