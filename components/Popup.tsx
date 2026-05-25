import { ComponentProps } from "./classes.ts";
import Container from "./Container/index.tsx";
import { processChildren } from "./index.ts";

export interface PopupProps extends ComponentProps {
  /** Alpine.js Store 中的狀態鍵名 */
  state?: string;
  /** 是否自動關閉 */
  autoClose?: boolean;
  /** 定位方式 */
  position?: "absolute" | "fixed";
  /** 定位偏移 */
  offset?: { top?: string; left?: string; right?: string; bottom?: string };
  /** 任何額外屬性 */
  [key: string]: any;
}

export default function Popup({
  className,
  variant,
  color,
  state = "popupOpen",
  autoClose = false,
  position = "absolute",
  offset,
  showBackdrop = true,
  fullWidth = false,
  children,
  context,
  ...restProps
}: PopupProps) {
  // 使用狀態管理，類似 Modal 組件
  const ref = `$store.popups.${state}`;
  
  // 自動初始化 Alpine.js Store 狀態
  const initScript = `
    if(!Alpine.store('popups')){Alpine.store('popups',{})}
    if(Alpine.store('popups').${state}===undefined){Alpine.store('popups').${state}=false}
    $watch('$store.popups.${state}', (val) => {
      if (val) {
        window.dispatchEvent(new CustomEvent('popup-opened', { detail: { state: '${state}' } }));
      }
    });
  `.replace(/\s+/g, ' ').trim();

  // 根據定位方式設置樣式
  const popupClasses = [
    position === "fixed" ? "fixed" : "absolute",
    "z-40",
    fullWidth && "left-0 right-0",
    !fullWidth && offset?.top ? `top-${offset.top}` : "top-full",
    !fullWidth && offset?.left ? `left-${offset.left}` : "left-0",
    !fullWidth && offset?.right ? `right-${offset.right}` : "",
    offset?.bottom ? `bottom-${offset.bottom}` : "",
    "mt-1"
  ].filter(Boolean).join(" ");

  // Popup 的 Alpine.js 屬性
  const popupAlpine: Record<string, string> = {
    'x-show': ref,
    'x-transition:enter': 'popover-enter',
    'x-transition:leave': 'popover-leave',
    'x-on:click.stop': '',
  };

  // 不管什麼情況，點擊外部都要關閉，所以總是添加背景層
  const backdropAlpine: Record<string, string> = {
    'x-show': ref,
    'x-transition:enter': 'animate-in fade-in',
    'x-transition:leave': 'animate-out fade-out',
    'x-on:click': `${ref} = false`,
  };

  // 如果啟用自動關閉，點擊內部也關閉
  if (autoClose) {
    // 在 Popup 主體也添加點擊關閉（移除阻止事件冒泡）
    popupAlpine['@click'] = `${ref} = false`;
    // 移除 @click.stop，讓點擊內部也能關閉
    delete popupAlpine['@click.stop'];
  }

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div x-data x-init={initScript}>
      {/* 全螢幕透明背景層，用於點擊外部關閉 */}
      <div
        class="fixed inset-0 z-30 bg-transparent"
        {...backdropAlpine}
      />
      {/* Popup 內容 */}
      <div
        class={popupClasses}
        {...popupAlpine}
        {...restProps}
      >
        <Container
          variant={variant}
          color={color}
          className={className || (fullWidth ? "w-full" : "w-fit")}
          padding="none"
          align="center"
          justify="center"
          context={context}
        >
          {processedChildren}
        </Container>
      </div>
    </div>
  );
}