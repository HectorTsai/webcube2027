import type { CalendarProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function Calendar({
  className,
  variant,
  color,
  targetInputId,
  popupState,
  popupStore = "popups",
  context,
  skeleton,
  ...restProps
}: CalendarProps) {
  // 生成 Alpine.js 事件處理屬性
  const generateAlpineAttributes = () => {
    const attributes: Record<string, string> = {};
    
    if (targetInputId || popupState) {
      // 簡單的 Alpine.js 事件處理，直接更新目標元素和關閉 Popup
      const popupRef = popupState ? `$store.${popupStore}.${popupState}` : null;
      
      attributes["x-data"] = `{
        selectedDate: '',
        handleDateChange(event) {
          this.selectedDate = event.detail?.value || event.target?.value || '';
          const target = document.getElementById('${targetInputId}');
          if (target) {
            target.value = this.selectedDate;
            target.innerText = this.selectedDate;
          }
          ${popupRef ? `${popupRef} = false;` : ''}
        }
      }`;
      
      attributes["x-on:change"] = "handleDateChange($event)";
    }
    
    return attributes;
  };

  const alpineAttributes = generateAlpineAttributes();

  return (
    <Container
      variant={variant}
      color={color}
      className={"w-fit "+className}
      padding="sm"
      align="center"
      justify="center"
      context={context}
      skeleton={skeleton}
    >
      <calendar-date 
        class="cally" 
        {...restProps}
        {...alpineAttributes}
      >
        <svg 
          aria-label="Previous" 
          class="fill-current size-4" 
          slot="previous" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5"></path>
        </svg>
        <svg 
          aria-label="Next" 
          class="fill-current size-4" 
          slot="next" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5"></path>
        </svg>
        <calendar-month></calendar-month>
      </calendar-date>
    </Container>
  );
}
