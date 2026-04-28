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
  const generateAlpineAttributes = () => {
    const attributes: Record<string, string> = {};
    
    if (targetInputId || popupState) {
      const popupRef = popupState ? `$store.${popupStore}.${popupState}` : null;
      
      attributes["x-data"] = `{
        selectedDate: '',
        init() {
          const target = document.getElementById('${targetInputId}');
          let val = '';
          if (target) val = target.value || target.innerText;
          this.selectedDate = val || new Date().toISOString().split('T')[0];
          
          if (${popupRef !== null}) {
            this.$watch('${popupRef}', (isOpen) => {
              if (isOpen) {
                setTimeout(() => {
                  const c = this.$el;
                  if (this.selectedDate) {
                    c.value = this.selectedDate;
                    c.focusedDate = this.selectedDate;
                  }
                }, 50);
              }
            });
          }
        },
        handleDateChange(event) {
          const val = event.detail?.value || event.target?.value || '';
          this.selectedDate = val;
          const target = document.getElementById('${targetInputId}');
          if (target) {
            if ('value' in target) target.value = val;
            target.innerText = val;
          }
          if (${popupRef !== null}) {
            ${popupRef} = false;
          }
        }
      }`.replace(/\s+/g, ' ');

      /* 核心修改：改用 x-model 以獲得更好的 Web Component 相容性，避免與 manual property 設定衝突 */
      attributes[":value"] = "selectedDate";
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