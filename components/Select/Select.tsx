import type { SelectProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Popup from "../Popup.tsx";
import List from "../List/List.tsx";
import { processChildren } from "../index.ts";

export default function Select({
  variant = "outline",
  color = "neutral",
  value,
  defaultValue,
  disabled = false,
  placeholder = "請選擇...",
  showArrow = true,
  state = "selectOpen",
  children,
  className,
  context,
  ...restProps
}: SelectProps) {
  const ref = `$store.popups.${state}`;
  const selectedLabelRef = `$store.popups.${state}SelectedLabel`;
  
  // 自動初始化 Alpine.js Store 狀態
  const initScript = `
    if(!Alpine.store('popups')){Alpine.store('popups',{})}
    if(Alpine.store('popups').${state}===undefined){Alpine.store('popups').${state}=false}
    if(Alpine.store('popups').${state}SelectedValue===undefined){Alpine.store('popups').${state}SelectedValue='${value || defaultValue || ''}'}
    if(Alpine.store('popups').${state}SelectedLabel===undefined){Alpine.store('popups').${state}SelectedLabel='${placeholder}'}
  `.replace(/\s+/g, ' ').trim();
  
  // 設置容器樣式
  const containerClasses = [
    "relative w-full",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className
  ].filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div 
      x-data 
      x-init={initScript}
      class="relative w-full"
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
        position="absolute"
        offset={{ top: "full" }}
        fullWidth
        width="full"
      >
        <List color={color} variant={variant} context={context}>
          {processedChildren}
        </List>
      </Popup>
    </div>
  );
}