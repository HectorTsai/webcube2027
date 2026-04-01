/*
 * Drawer 抽屜元件
 * 支援四個方向的滑入動畫、多種關閉方式、自訂尺寸
 * 使用 HonoJSX DOM 運行時，支援 React-like hooks
 */

import { useState, useEffect, forwardRef } from "hono/jsx";

export interface DrawerProps {
  /** 元件 ID，用於外部控制 */
  id: string;
  /** 依附位置 */
  position: "top" | "bottom" | "left" | "right";
  /** 預設開關狀態 */
  defaultOpen?: boolean;
  /** 抽屜內容 */
  children: unknown;
  /** 尺寸控制（寬度或高度） */
  size?: string | number;
  /** 開啟動畫類名 */
  openAnimation?: string;
  /** 關閉動畫類名 */
  closeAnimation?: string;
  /** 關閉回調函數 */
  onClose?: () => void;
  /** 開啟回調函數 */
  onOpen?: () => void;
  /** 額外 CSS 類名 */
  className?: string;
}

const Drawer = (props: DrawerProps, ref: any) => {
  const [isOpen, setIsOpen] = useState(props.defaultOpen || false);
  
  // 開啟方法
  const open = () => {
    setIsOpen(true);
    props.onOpen?.();
  };
  
  // 關閉方法
  const close = () => {
    setIsOpen(false);
    props.onClose?.();
  };
  
  // 切換方法
  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };
  
  // 方法註冊到 ref
  useEffect(() => {
    if (ref) {
      ref.current = {
        open,
        close,
        toggle,
        isOpen: () => isOpen
      };
    }
  }, [ref, isOpen, open, close, toggle]);
  
    
  // 獲取位置相關的 CSS 類名
  const getPositionClasses = () => {
    const baseClasses = "fixed z-50 transition-all duration-300";
    
    switch (props.position) {
      case 'left':
        return `${baseClasses} left-0 top-0 h-full ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
      case 'right':
        return `${baseClasses} right-0 top-0 h-full ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;
      case 'top':
        return `${baseClasses} top-0 left-0 w-full ${isOpen ? 'translate-y-0' : '-translate-y-full'}`;
      case 'bottom':
        return `${baseClasses} bottom-0 left-0 w-full ${isOpen ? 'translate-y-0' : 'translate-y-full'}`;
      default:
        return baseClasses;
    }
  };
  
  // 獲取尺寸樣式
  const getSizeStyle = () => {
    const size = props.size || (props.position === 'left' || props.position === 'right' ? 320 : 200);
    
    if (props.position === 'left' || props.position === 'right') {
      return { width: typeof size === 'number' ? `${size}px` : size };
    } else {
      return { height: typeof size === 'number' ? `${size}px` : size };
    }
  };
  
  // 獲取關閉按鈕位置
  const getCloseButtonClasses = () => {
    const baseClasses = "absolute p-2 rounded-lg cursor-pointer btn btn-ghost";
    
    switch (props.position) {
      case 'left':
        return `${baseClasses} top-4 right-4`;
      case 'right':
        return `${baseClasses} top-4 left-4`;
      case 'top':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom':
        return `${baseClasses} top-4 right-4`;
      default:
        return baseClasses;
    }
  };
  
  // 獲取動畫類名
  const getAnimationClasses = () => {
    if (isOpen) {
      return props.openAnimation || '';
    } else {
      return props.closeAnimation || '';
    }
  };
  
  // 獲取預設動畫類名（根據位置）
  const getDefaultAnimationClasses = () => {
    if (!props.openAnimation && !props.closeAnimation) {
      if (isOpen) {
        switch (props.position) {
          case 'left':
            return 'animate-in slide-in-from-left';
          case 'right':
            return 'animate-in slide-in-from-right';
          case 'top':
            return 'animate-in slide-in-from-top';
          case 'bottom':
            return 'animate-in slide-in-from-bottom';
          default:
            return '';
        }
      } else {
        switch (props.position) {
          case 'left':
            return 'animate-out slide-out-to-left';
          case 'right':
            return 'animate-out slide-out-to-right';
          case 'top':
            return 'animate-out slide-out-to-top';
          case 'bottom':
            return 'animate-out slide-out-to-bottom';
          default:
            return '';
        }
      }
    }
    return '';
  };
  
  return (
    <>
      {/* 全螢幕透明覆蓋層 */}
      <div 
        id={`${props.id}-overlay`}
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        onclick="toggleMainMenuDrawer()"
        style={{ display: isOpen ? 'block' : 'none' }}
      />
      {/* Drawer 內容 */}
      <div 
        id={props.id}
        class={`${getPositionClasses()} ${getAnimationClasses()} ${getDefaultAnimationClasses()} ${props.className || ''}`}
        style={getSizeStyle()}
      >
        <div 
          class="bg-base-100 text-base-content h-full overflow-auto"
          onclick="event.stopPropagation()"
        >
        {/* 關閉按鈕 */}
        <button 
          type="button"
          class={getCloseButtonClasses()}
          onclick="toggleMainMenuDrawer()"
          aria-label="關閉抽屜"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* 內容區域 */}
        <div class="p-4">
          {props.children}
        </div>
      </div>
      </div>
    </>
  );
};

/* 舊版字串格式水合函數已移除，Drawer 不需要獨立的水合函數，
   它由 MainMenu 等父組件的水合腳本一併 import 使用 */

export default forwardRef(Drawer);
