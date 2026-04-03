/*
 * Drawer 抽屜元件
 * 支援四個方向的滑入動畫、多種關閉方式、自訂尺寸
 * 使用 HonoJSX DOM 運行時，支援 React-like hooks
 */

import { jsx } from "hono/jsx/jsx-runtime";
import Button from './Button.tsx';

export interface DrawerProps {
  /** 依附位置 */
  position: "top" | "bottom" | "left" | "right";
  /** 抽屜內容 */
  children: unknown;
  /** 尺寸控制（寬度或高度） */
  size?: string | number;
  /** 額外 CSS 類名 */
  className?: string;
  /** 顏色主題 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger";
  /** Alpine.js 狀態變數名稱（預設: drawerOpen） */
  stateName?: string;
  /** 抽屜標題（可選） */
  title?: string;
  
  // Alpine.js 相關屬性
  xData?: string; // Alpine.js 數據綁定
}

// 預計算的位置配置
const POSITION_CONFIGS = {
  left: {
    enter: 'animate-in slide-in-from-left',
    leave: 'animate-out slide-out-to-left',
    classes: 'left-0 top-0 h-full',
    padding: 'p-4 pt-6',
    defaultSize: 320,
    closeButtonPosition: 'absolute left-0 right-0 top-0'
  },
  right: {
    enter: 'animate-in slide-in-from-right',
    leave: 'animate-out slide-out-to-right',
    classes: 'right-0 top-0 h-full',
    padding: 'p-4 pt-6',
    defaultSize: 320,
    closeButtonPosition: 'absolute left-0 right-0 top-0'
  },
  top: {
    enter: 'animate-in slide-in-from-top',
    leave: 'animate-out slide-out-to-top',
    classes: 'top-0 left-0 w-full',
    padding: 'p-4 pb-6',
    defaultSize: 200,
    closeButtonPosition: 'absolute left-0 right-0 bottom-0'
  },
  bottom: {
    enter: 'animate-in slide-in-from-bottom',
    leave: 'animate-out slide-out-to-bottom',
    classes: 'bottom-0 left-0 w-full',
    padding: 'p-4 pt-6',
    defaultSize: 200,
    closeButtonPosition: 'absolute left-0 right-0 top-0'
  }
} as const;

// 位置配置函數
function getDrawerPositionConfig(position: string) {
  return POSITION_CONFIGS[position as keyof typeof POSITION_CONFIGS] || POSITION_CONFIGS.right;
}

// 動畫獲取函數
async function getDrawerAnimations(position: string, context?: any) {
  let enterAnimation = '';
  let leaveAnimation = '';
  
  try {
    if (context) {
      const { InnerAPI } = await import('../../services/index.ts');
      const skeletonResponse = await InnerAPI(context, '/api/v1/skeleton');
      const skeletonData = await skeletonResponse.json();
      
      if (skeletonData.success && skeletonData.data?.動畫) {
        const 動畫設定 = skeletonData.data.動畫;
        const 位置Key = position === 'left' ? '左' : 
                        position === 'right' ? '右' : 
                        position === 'top' ? '上' : '下';
        
        const 開啟動畫 = 動畫設定[`抽屜.${位置Key}.開`];
        const 關閉動畫 = 動畫設定[`抽屜.${位置Key}.關`];
        
        if (開啟動畫) {
          enterAnimation = `animate-in ${開啟動畫}`;
        }
        if (關閉動畫) {
          leaveAnimation = `animate-out ${關閉動畫}`;
        }
      }
    }
  } catch (_error) {
    // 錯誤時使用預設值
  }
  
  return { enterAnimation, leaveAnimation };
}

// 尺寸計算函數
function getDrawerSize(size: string | number | undefined, position: string, defaultSize: number) {
  const finalSize = size || defaultSize;
  const isHorizontal = ['left', 'right'].includes(position);
  const sizeValue = typeof finalSize === 'number' ? `${finalSize}px` : finalSize;
  
  return {
    [isHorizontal ? 'width' : 'height']: sizeValue
  };
}

export default async function Drawer(props: DrawerProps, _ref: unknown, context?: any) {
  // 狀態變數名稱
  const stateVar = props.stateName || 'drawerOpen';
  
  // 顏色設定
  const color = props.color || 'primary';
  
  // 準備 Alpine.js 屬性
  const alpineProps: Record<string, string> = {
    '@keydown.escape.window': `${stateVar} = false`,
    'x-init': `$nextTick(() => { if (${stateVar}) $el.querySelector('button, input, [tabindex]')?.focus() })`
  };
  
  if (props.xData) {
    alpineProps['x-data'] = props.xData;
  }
  
  // 取得位置配置
  const positionConfig = getDrawerPositionConfig(props.position);
  
  // 取得動畫設定並直接使用預設值
  const { enterAnimation, leaveAnimation } = await getDrawerAnimations(props.position, context);
  const finalEnterAnimation = enterAnimation || positionConfig.enter;
  const finalLeaveAnimation = leaveAnimation || positionConfig.leave;

  // 位置和尺寸配置
  const sizeStyle = getDrawerSize(props.size, props.position, positionConfig.defaultSize);
    
  return (
    <>
      {/* 全螢幕透明覆蓋層 */}
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-49"
        x-show={stateVar}
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-in duration-300"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        x-on:click={`${stateVar} = false`}
      />
      {/* Drawer 內容 */}
      <div
        role="complementary"
        aria-label={props.title || "側邊抽屜"}
        x-show={stateVar}
        x-transition:enter={finalEnterAnimation}
        x-transition:leave={finalLeaveAnimation}
        class={`fixed z-50 transition-all duration-300 ${positionConfig.classes} ${props.className || ''}`}
        style={sizeStyle}
        {...alpineProps}
      >
        <div 
          class={`bg-base-100 h-full flex flex-col`}
        >
          <div class={`h-full w-full bg-${color}/80 text-${color}-content relative flex flex-col pr-2`}>
        {/* 浮動的標題和按鈕區域 */}
        <div 
          class={`${positionConfig.closeButtonPosition} px-2 bg-${color}/80 flex-shrink-0 overflow-x-hidden`}
        >
          <div class={`flex justify-between ${props.position === 'right' ? 'flex-row-reverse' : ''}`}>
            <span>&nbsp;</span>
            <span class="text-lg font-semibold truncate">
              {props.title ?? "\u00A0"}
            </span>
            <Button size="sm"
              variant="solid"
              color={color}
              aria-label="關閉抽屜"
              onClick={`${stateVar} = false`}
            >
              ✕
            </Button>
          </div>
        </div>
        
        {/* 內容區域 - 可滾動 */}
        <div class={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-themed ${positionConfig.padding}`}>
          {props.children}
        </div>
        </div>
      </div>
      </div>
    </>
  );
}
