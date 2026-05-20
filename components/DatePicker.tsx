import { ComponentProps } from "./classes.ts";
import Container from "./Container/index.tsx";
import Button from "./Button.tsx";
import Span from "./Span.tsx";

export interface DatePickerProps extends ComponentProps {
  /** 表單欄位名稱 */
  name?: string;
  /** 初始日期值 (YYYY-MM-DD) */
  value?: string;
  /** 最小年份 */
  minYear?: number;
  /** 最大年份 */
  maxYear?: number;
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
  /** 標題 */
  title?: string;
  /** 外部 input 的 ID，用於同步值。若未提供則自動生成 hidden input */
  inputId?: string;
}

export default async function DatePicker({
  name,
  value,
  minYear = new Date().getFullYear() - 50,
  maxYear = new Date().getFullYear() + 10,
  size = "md",
  title,
  inputId,
  className = '',
  variant,
  color,
  context,
  ...restProps
}: DatePickerProps) {
  const sizeConfig = {
    sm: { height: 120, slideHeight: 32, fontSize: "14px", labelSize: "12px", padding: "md" as const },
    md: { height: 160, slideHeight: 40, fontSize: "20px", labelSize: "14px", padding: "lg" as const },
    lg: { height: 200, slideHeight: 48, fontSize: "24px", labelSize: "16px", padding: "xl" as const },
  };
  
  const config = sizeConfig[size];
  const initialDate = value ? new Date(value) : new Date();
  const currentYear = initialDate.getFullYear();
  const currentMonth = initialDate.getMonth() + 1;
  const currentDay = initialDate.getDate();

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const lang = context?.get("語言")??"zh-tw";

  const paddingItems = Array.from({ length: 2 }, () => null);

  const yearIndex = years.indexOf(currentYear) + paddingItems.length;
  const monthIndex = months.indexOf(currentMonth) + paddingItems.length;
  const dayIndex = days.indexOf(currentDay) + paddingItems.length;

  const instanceId = `datepicker_${name || 'default'}`;
  const targetInputId = inputId || `hidden_${instanceId}`;

  const initScript = `
    (() => {
      let emblaYear, emblaMonth, emblaDay;
      
      function getInitialValue() {
        const inputEl = document.getElementById('${targetInputId}');
        if (inputEl && inputEl.value) {
          return inputEl.value;
        }
        return '${value || ''}';
      }
      
      const initialDate = getInitialValue();
      const parts = initialDate ? initialDate.split('-') : [];
      const initYear = parts[0] ? parseInt(parts[0]) : ${currentYear};
      const initMonth = parts[1] ? parseInt(parts[1]) : ${currentMonth};
      const initDay = parts[2] ? parseInt(parts[2]) : ${currentDay};
      
      const yearIdx = ${JSON.stringify(years)}.indexOf(initYear);
      const monthIdx = ${JSON.stringify(months)}.indexOf(initMonth);
      const dayIdx = ${JSON.stringify(days)}.indexOf(initDay);
      
      const finalYearIdx = yearIdx >= 0 ? yearIdx + ${paddingItems.length} : ${yearIndex};
      const finalMonthIdx = monthIdx >= 0 ? monthIdx + ${paddingItems.length} : ${monthIndex};
      const finalDayIdx = dayIdx >= 0 ? dayIdx + ${paddingItems.length} : ${dayIndex};
      
      $store.DatePicker = $store.DatePicker || {};
      $store.DatePicker.year = initYear;
      $store.DatePicker.month = initMonth;
      $store.DatePicker.day = initDay;
      $store.DatePicker.date = initialDate || '${value || new Date().toISOString().split('T')[0]}';
      
      function initEmbla() {
        if (typeof EmblaCarousel === 'undefined') {
          setTimeout(initEmbla, 50);
          return;
        }
        
        if (emblaYear) return;
        
        const container = $refs.yearContainer;
        if (!container || container.offsetHeight === 0) {
          setTimeout(initEmbla, 100);
          return;
        }
        
        const options = {
          dragFree: false,
          containScroll: 'keepSnaps',
          align: 'center',
          duration: 20,
          loop: false,
          axis: 'y'
        };
        
        emblaYear = EmblaCarousel($refs.yearContainer, options);
        emblaMonth = EmblaCarousel($refs.monthContainer, options);
        emblaDay = EmblaCarousel($refs.dayContainer, options);
        
        emblaYear.scrollTo(finalYearIdx);
        emblaMonth.scrollTo(finalMonthIdx);
        emblaDay.scrollTo(finalDayIdx);
        
        setTimeout(() => {
          updateDate();
        }, 50);
        
        emblaYear.on('select', updateDate);
        emblaMonth.on('select', updateDate);
        emblaDay.on('select', updateDate);
        
        emblaYear.on('pointerUp', updateDate);
        emblaMonth.on('pointerUp', updateDate);
        emblaDay.on('pointerUp', updateDate);
        
        function refresh() {
          const inputEl = document.getElementById('${targetInputId}');
          if (!inputEl || !inputEl.value) return;
          
          const parts = inputEl.value.split('-');
          const targetYear = parseInt(parts[0]);
          const targetMonth = parseInt(parts[1]);
          const targetDay = parseInt(parts[2]);
          
          const targetYearIdx = ${JSON.stringify(years)}.indexOf(targetYear);
          const targetMonthIdx = ${JSON.stringify(months)}.indexOf(targetMonth);
          const targetDayIdx = ${JSON.stringify(days)}.indexOf(targetDay);
          
          if (targetYearIdx >= 0) emblaYear.scrollTo(targetYearIdx + ${paddingItems.length});
          if (targetMonthIdx >= 0) emblaMonth.scrollTo(targetMonthIdx + ${paddingItems.length});
          if (targetDayIdx >= 0) emblaDay.scrollTo(targetDayIdx + ${paddingItems.length});
          
          setTimeout(() => updateDate(), 300);
        }
        
        window.${instanceId} = { goToToday, setValue, refresh, emblaYear, emblaMonth, emblaDay };
        
        let hasRefreshed = false;
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.height > 0 && !hasRefreshed) {
              hasRefreshed = true;
              setTimeout(() => refresh(), 100);
            } else if (entry.contentRect.height === 0) {
              hasRefreshed = false;
            }
          }
        });
        
        resizeObserver.observe($el);
      }
      
      function updateDate() {
        const yearIndex = emblaYear.selectedScrollSnap();
        const monthIndex = emblaMonth.selectedScrollSnap();
        const dayIndex = emblaDay.selectedScrollSnap();
        
        const year = ${JSON.stringify(years)}[yearIndex - ${paddingItems.length}];
        const month = ${JSON.stringify(months)}[monthIndex - ${paddingItems.length}];
        
        if (!year || !month) return;
        
        const daysInMonth = new Date(year, month, 0).getDate();
        const currentDayIndex = emblaDay.selectedScrollSnap();
        const selectedDay = ${JSON.stringify(days)}[currentDayIndex - ${paddingItems.length}];
        let day = selectedDay && selectedDay <= daysInMonth ? selectedDay : daysInMonth;
        
        const daySlides = $refs.dayContainer.querySelectorAll('.datepicker-embla__slide');
        daySlides.forEach((slide, index) => {
          const dayNum = index - ${paddingItems.length};
          if (dayNum >= 0 && dayNum < 31) {
            const actualDay = dayNum + 1;
            if (actualDay > daysInMonth) {
              slide.style.visibility = 'hidden';
              slide.style.pointerEvents = 'none';
            } else {
              slide.style.visibility = 'visible';
              slide.style.pointerEvents = 'auto';
            }
          }
        });
        
        if (selectedDay > daysInMonth) {
          day = daysInMonth;
          emblaDay.scrollTo(${paddingItems.length} + daysInMonth - 1);
        }
        
        const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        $store.DatePicker = $store.DatePicker || {};
        $store.DatePicker.year = year;
        $store.DatePicker.month = month;
        $store.DatePicker.day = day;
        $store.DatePicker.date = dateStr;
        
        const targetInput = document.getElementById('${targetInputId}');
        if (targetInput) {
          targetInput.value = dateStr;
        }
      }
      
      function goToToday() {
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        
        const targetYearIndex = ${JSON.stringify(years)}.indexOf(todayYear);
        const targetMonthIndex = ${JSON.stringify(months)}.indexOf(todayMonth);
        const targetDayIndex = ${JSON.stringify(days)}.indexOf(todayDay);
        
        if (targetYearIndex !== -1) emblaYear.scrollTo(targetYearIndex + ${paddingItems.length});
        if (targetMonthIndex !== -1) emblaMonth.scrollTo(targetMonthIndex + ${paddingItems.length});
        if (targetDayIndex !== -1) emblaDay.scrollTo(targetDayIndex + ${paddingItems.length});
        
        setTimeout(() => updateDate(), 300);
      }
      
      function setValue(dateStr) {
        if (!dateStr) return;
        
        function doSetValue() {
          if (!emblaYear || !emblaMonth || !emblaDay) {
            setTimeout(doSetValue, 50);
            return;
          }
          
          const parts = dateStr.split('-');
          const targetYear = parseInt(parts[0]);
          const targetMonth = parseInt(parts[1]);
          const targetDay = parseInt(parts[2]);
          
          const targetYearIndex = ${JSON.stringify(years)}.indexOf(targetYear);
          const targetMonthIndex = ${JSON.stringify(months)}.indexOf(targetMonth);
          const targetDayIndex = ${JSON.stringify(days)}.indexOf(targetDay);
          
          if (targetYearIndex !== -1) emblaYear.scrollTo(targetYearIndex + ${paddingItems.length});
          if (targetMonthIndex !== -1) emblaMonth.scrollTo(targetMonthIndex + ${paddingItems.length});
          if (targetDayIndex !== -1) emblaDay.scrollTo(targetDayIndex + ${paddingItems.length});
          
          setTimeout(() => updateDate(), 300);
        }
        
        doSetValue();
      }
      
      initEmbla();
    })()
  `.replace(/\s+/g, ' ').trim();

  return (
    <Container
      variant={variant}
      color={color}
      className={`w-full ${className}`}
      padding={title ? config.padding : "none"}
      align="stretch"
      justify="center"
      context={context}
    >
      <div
        x-data
        x-init={initScript}
        class={`select-none`}
        {...restProps}
      >
        {title && (
          <div class="text-center mb-4" style={{ fontSize: config.fontSize }}>{title}</div>
        )}
        {!inputId && name && (
          <input
            type="hidden"
            id={targetInputId}
            name={name}
            value={value || ''}
          />
        )}
        <style>
          {`
            .datepicker-embla {
              overflow: hidden;
              width: 100%;
            }
            .datepicker-embla__container {
              display: flex;
              flex-direction: column;
              touch-action: pan-y pinch-zoom;
              height: 100%;
            }
            .datepicker-embla__slide {
              flex: 0 0 ${config.slideHeight}px;
              min-width: 0;
              height: ${config.slideHeight}px;
            }
            .datepicker-highlight {
              position: absolute;
              top: 50%;
              left: 0;
              right: 0;
              height: ${config.slideHeight}px;
              transform: translateY(-50%);
              background: rgba(0, 0, 0, 0.05);
              border-top: 1px solid rgba(0, 0, 0, 0.1);
              border-bottom: 1px solid rgba(0, 0, 0, 0.1);
              pointer-events: none;
              z-index: 0;
            }
            .datepicker-embla__slide.is-selected > div {
              font-weight: 600;
            }
          `}
        </style>
        
        <div class="flex gap-4 w-full">
          <div class="relative flex-1">
            <div class="relative" style={{ height: `${config.height}px` }}>
              <div class="datepicker-highlight"></div>
              <div x-ref="yearContainer" class="datepicker-embla h-full">
                <div class="datepicker-embla__container h-full">
                  {paddingItems.map((_, i) => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={`year-pad-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                  {years.map(year => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={year}>
                      <div style={{ fontSize: config.fontSize, opacity: 0.6 }}>{year}</div>
                    </div>
                  ))}
                  {paddingItems.map((_, i) => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={`year-pad-end-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-center w-8" style={{ fontSize: config.labelSize, opacity: 0.7 }}><Span language="zh-tw" context={context}>年</Span></div>
          
          <div class="relative flex-1">
            <div class="relative" style={{ height: `${config.height}px` }}>
              <div class="datepicker-highlight"></div>
              <div x-ref="monthContainer" class="datepicker-embla h-full">
                <div class="datepicker-embla__container h-full">
                  {paddingItems.map((_, i) => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={`month-pad-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                  {months.map(month => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={month}>
                      <div style={{ fontSize: config.fontSize, opacity: 0.6 }}>{month}</div>
                    </div>
                  ))}
                  {paddingItems.map((_, i) => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={`month-pad-end-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-center w-8" style={{ fontSize: config.labelSize, opacity: 0.7 }}><Span language="zh-tw" context={context}>月</Span></div>
          
          <div class="relative flex-1">
            <div class="relative" style={{ height: `${config.height}px` }}>
              <div class="datepicker-highlight"></div>
              <div x-ref="dayContainer" class="datepicker-embla h-full">
                <div class="datepicker-embla__container h-full">
                  {paddingItems.map((_, i) => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={`day-pad-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                  {days.map(day => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={day}>
                      <div style={{ fontSize: config.fontSize, opacity: 0.6 }}>{day}</div>
                    </div>
                  ))}
                  {paddingItems.map((_, i) => (
                    <div class="datepicker-embla__slide flex items-center justify-center" key={`day-pad-end-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-center w-8" style={{ fontSize: config.labelSize, opacity: 0.7 }}><Span language="zh-tw" context={context}>日</Span></div>
        </div>
        
        <div class="mt-4">
          <Button
            variant={variant}
            color={color}
            className="w-full"
            onClick={`window.${instanceId} && window.${instanceId}.goToToday()`}
          >
            今天
          </Button>
        </div>
      </div>
    </Container>
  );
}
