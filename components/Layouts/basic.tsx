import { ComponentProps } from '../classes.ts';

export interface BasicLayoutProps extends ComponentProps {
  /** 選單列內容 */
  menuBar?: any;
  /** 頁腳內容 */
  footer?: any;
  /** 是否固定選單列 */
  stickyMenuBar?: boolean;
  /** 是否固定頁腳 */
  stickyFooter?: boolean;
  /** 內容區域最小高度 */
  minHeight?: string;
  /** 內容區域最大高度 */
  maxHeight?: string;
}

export default function BasicLayout({
  children,
  menuBar,
  footer,
  stickyMenuBar = true,
  stickyFooter = true,
  minHeight = 'auto',
  maxHeight = 'none',
  className = '',
  ...restProps
}: BasicLayoutProps) {
  // 建立 CSS 類別字串
  const layoutClasses = [
    'grid',
    'grid-rows-[auto_1fr_auto]', // 三行佈局：選單列、內容、頁腳
    'min-h-screen', // 最小高度為視窗高度
    'w-full', // 寬度100%
    className
  ].filter(Boolean).join(' ');

  const menuBarClasses = [
    'row-start-1', // 第一行
    stickyMenuBar ? 'sticky top-0 z-50' : '' // 固定選單列
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'row-start-2', // 第二行
    'overflow-y-auto', // 垂直滾動
    'auto-y-scroller', // 自動滾動
    'min-h-0', // 最小高度為0
    `min-h-[${minHeight}]`, // 自定義最小高度
    `max-h-[${maxHeight}]` // 自定義最大高度
  ].filter(Boolean).join(' ');

  const footerClasses = [
    'row-start-3', // 第三行
    stickyFooter ? 'sticky bottom-0' : '' // 固定頁腳
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses} {...restProps}>
      {/* 選單列區域 */}
      {menuBar && (
        <header className={menuBarClasses}>
          {menuBar}
        </header>
      )}
      
      {/* 內容區域 */}
      <main className={contentClasses}>
        {children}
      </main>
      
      {/* 頁腳區域 */}
      {footer && (
        <footer className={footerClasses}>
          {footer}
        </footer>
      )}
    </div>
  );
}