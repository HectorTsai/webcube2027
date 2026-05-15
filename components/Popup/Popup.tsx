import type { PopupProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function Popup({
  className,
  variant,
  color,
  state = "popupOpen",
  store = "popups",
  autoClose = false,
  position = "absolute",
  offset,
  onClose,
  showBackdrop = true,
  fullWidth = false,
  children,
  ...restProps
}: PopupProps) {
  // 使用狀態管理，類似 Modal 組件
  const ref = `$store.${store}.${state}`;
  
  // 自動初始化 Alpine.js Store 狀態
  const initScript = `
    if(!Alpine.store('${store}')){Alpine.store('${store}',{})}
    if(Alpine.store('${store}').${state}===undefined){Alpine.store('${store}').${state}=false}
    $watch('$store.${store}.${state}', (val) => {
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
    popupAlpine['x-on:click'] = `${ref} = false`;
    // 移除 x-on:click.stop，讓點擊內部也能關閉
    delete popupAlpine['x-on:click.stop'];
  }

  return (
    <div x-data x-init={initScript}>
      {/* 全屏透明背景層，用於點擊外部關閉 */}
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
        >
          {children}
        </Container>
      </div>
    </div>
  );
}