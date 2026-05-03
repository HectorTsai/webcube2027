import type { SelectProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Popup from "../Popup/index.tsx";
import List from "../List/List.tsx";

export default function Select({
  variant = "outline",
  color = "neutral",
  value,
  defaultValue,
  disabled = false,
  placeholder = "請選擇...",
  showArrow = true,
  state = "selectOpen",
  store = "selects",
  children,
  className,
  context,
  skeleton,
  ...restProps
}: SelectProps) {
  const ref = `$store.${store}.${state}`;
  const selectedLabelRef = `$store.${store}.${state}SelectedLabel`;
  
  // 自動初始化 Alpine.js Store 狀態
  const initScript = `
    if(!Alpine.store('${store}')){Alpine.store('${store}',{})}
    if(Alpine.store('${store}').${state}===undefined){Alpine.store('${store}').${state}=false}
    if(Alpine.store('${store}').${state}SelectedValue===undefined){Alpine.store('${store}').${state}SelectedValue='${value || defaultValue || ''}'}
    if(Alpine.store('${store}').${state}SelectedLabel===undefined){Alpine.store('${store}').${state}SelectedLabel='${placeholder}'}
  `.replace(/\s+/g, ' ').trim();
  
  // 設置容器樣式
  const containerClasses = [
    "relative w-full",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className
  ].filter(Boolean).join(" ");

  return (
    <div 
      x-data 
      x-init={initScript}
      class="relative w-full"
      data-select-store={store}
      data-select-state={state}
      {...restProps}
    >
      {/* 選擇框容器 */}
      <Container 
        variant={variant}
        color={color}
        width="full"
        height="auto"
        padding="sm"
        margin="none"
        align="start"
        justify="between"
        gap="none"
        rounded="md"
        shadow="none"
        context={context}
        skeleton={skeleton}
        className={containerClasses}
        x-on:click={disabled ? "" : `${ref} = !${ref}`}
      >
        <div class="flex items-center justify-between w-full">
          <span x-text={selectedLabelRef} class="truncate"></span>
          {showArrow && (
            <svg 
              class={`w-4 h-4 transition-transform ${disabled ? 'opacity-30' : ''}`}
              x-bind:class={`${ref} ? 'rotate-180' : ''`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </Container>

      {/* 下拉選單 - 使用 Popup + List */}
      <Popup 
        state={state} 
        store={store}
        position="absolute"
        offset={{ top: "full" }}
        animateIn="animate-in fade-in zoom-in"
        animateOut="animate-out fade-out zoom-out"
        fullWidth
        width="full"
      >
        <List color={color} variant={variant}>
          {children}
        </List>
      </Popup>
    </div>
  );
}