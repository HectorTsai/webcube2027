import type { TimePickerProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Button from "../Button/index.tsx";

export default function TimePicker({
  name,
  value,
  initialHour = 12,
  initialMinute = 0,
  use24Hour = true,
  minuteInterval = 1,
  size = "md",
  title,
  showConfirm = false,
  confirmText = '確認',
  inputId,
  className = '',
  variant,
  color,
  context,
  skeleton,
  ...restProps
}: TimePickerProps) {
  const sizeConfig = {
    sm: { height: 120, slideHeight: 32, fontSize: "14px", labelSize: "12px", padding: "md" as const },
    md: { height: 160, slideHeight: 40, fontSize: "20px", labelSize: "14px", padding: "lg" as const },
    lg: { height: 200, slideHeight: 48, fontSize: "24px", labelSize: "16px", padding: "xl" as const },
  };
  
  const config = sizeConfig[size];

  const parsedTime = value ? value.split(':').map(Number) : [initialHour, initialMinute];
  const finalHour = parsedTime[0] ?? initialHour;
  const finalMinute = parsedTime[1] ?? initialMinute;

  const hours = use24Hour 
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);
  
  const minutes = Array.from({ length: Math.floor(60 / minuteInterval) }, (_, i) => i * minuteInterval);

  const paddingItems = Array.from({ length: 2 }, () => null);

  const hourIndex = (use24Hour ? hours.indexOf(finalHour) : hours.indexOf(finalHour % 12 === 0 ? 12 : finalHour % 12)) + paddingItems.length;
  const minuteIndex = minutes.indexOf(finalMinute) + paddingItems.length;

  const instanceId = `timepicker_${name || 'default'}`;
  const targetInputId = inputId || `hidden_${instanceId}`;

  const initScript = `
    (() => {
      let emblaHour, emblaMinute, emblaAmPm;
      
      function getInitialValue() {
        const inputEl = document.getElementById('${targetInputId}');
        if (inputEl && inputEl.value) {
          return inputEl.value;
        }
        return '${value || ''}';
      }
      
      const initialTime = getInitialValue();
      const timeParts = initialTime ? initialTime.split(':') : [];
      let initHour = timeParts[0] ? parseInt(timeParts[0]) : ${finalHour};
      let initMinute = timeParts[1] ? parseInt(timeParts[1]) : ${finalMinute};
      
      const displayHour = ${use24Hour ? 'initHour' : '(initHour % 12 === 0 ? 12 : initHour % 12)'};
      const hourIdx = ${JSON.stringify(hours)}.indexOf(displayHour);
      const minuteIdx = ${JSON.stringify(minutes)}.indexOf(initMinute);
      
      const finalHourIdx = hourIdx >= 0 ? hourIdx + ${paddingItems.length} : ${hourIndex};
      const finalMinuteIdx = minuteIdx >= 0 ? minuteIdx + ${paddingItems.length} : ${minuteIndex};
      
      $store.TimePicker = $store.TimePicker || {};
      $store.TimePicker.hour = initHour;
      $store.TimePicker.minute = initMinute;
      $store.TimePicker.time = initialTime || '${value || String(finalHour).padStart(2, '0') + ':' + String(finalMinute).padStart(2, '0')}';
      
      function initEmbla() {
        if (typeof EmblaCarousel === 'undefined') {
          setTimeout(initEmbla, 50);
          return;
        }
        
        if (emblaHour) return;
        
        const container = $refs.hourContainer;
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
        
        emblaHour = EmblaCarousel($refs.hourContainer, options);
        emblaMinute = EmblaCarousel($refs.minuteContainer, options);
        
        emblaHour.scrollTo(finalHourIdx);
        emblaMinute.scrollTo(finalMinuteIdx);
        
        ${!use24Hour ? `
          emblaAmPm = EmblaCarousel($refs.amPmContainer, options);
          emblaAmPm.scrollTo((initHour >= 12 ? 1 : 0) + ${paddingItems.length});
          emblaAmPm.on('select', updateTime);
          emblaAmPm.on('pointerUp', updateTime);
        ` : ''}
        
        setTimeout(() => {
          updateTime();
        }, 50);
        
        emblaHour.on('select', updateTime);
        emblaMinute.on('select', updateTime);
        
        emblaHour.on('pointerUp', updateTime);
        emblaMinute.on('pointerUp', updateTime);
        
        function refresh() {
          const inputEl = document.getElementById('${targetInputId}');
          if (!inputEl || !inputEl.value) return;
          
          const parts = inputEl.value.split(':');
          const targetHour = parseInt(parts[0]);
          const targetMinute = parseInt(parts[1]);
          
          const displayHour = ${use24Hour ? 'targetHour' : '(targetHour % 12 === 0 ? 12 : targetHour % 12)'};
          const targetHourIdx = ${JSON.stringify(hours)}.indexOf(displayHour);
          const targetMinuteIdx = ${JSON.stringify(minutes)}.indexOf(targetMinute);
          
          if (targetHourIdx >= 0) emblaHour.scrollTo(targetHourIdx + ${paddingItems.length});
          if (targetMinuteIdx >= 0) emblaMinute.scrollTo(targetMinuteIdx + ${paddingItems.length});
          
          ${!use24Hour ? `
            if (emblaAmPm) {
              emblaAmPm.scrollTo((targetHour >= 12 ? 1 : 0) + ${paddingItems.length});
            }
          ` : ''}
          
          setTimeout(() => updateTime(), 300);
        }
        
        window.${instanceId} = { goToNow, setValue, refresh, emblaHour, emblaMinute };
        
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
      
      function updateTime() {
        const hourIndex = emblaHour.selectedScrollSnap();
        const minuteIndex = emblaMinute.selectedScrollSnap();
        
        let hour = ${JSON.stringify(hours)}[hourIndex - ${paddingItems.length}];
        const minute = ${JSON.stringify(minutes)}[minuteIndex - ${paddingItems.length}];
        
        if (!hour || hour === null) return;
        
        ${!use24Hour ? `
          const amPmIndex = emblaAmPm.selectedScrollSnap() - ${paddingItems.length};
          if (amPmIndex === 1) {
            hour = hour === 12 ? 12 : hour + 12;
          } else if (hour === 12) {
            hour = 0;
          }
        ` : ''}
        
        const timeStr = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
        $store.TimePicker = $store.TimePicker || {};
        $store.TimePicker.hour = hour;
        $store.TimePicker.minute = minute;
        $store.TimePicker.time = timeStr;
        
        const targetInput = document.getElementById('${targetInputId}');
        if (targetInput) {
          targetInput.value = timeStr;
        }
      }
      
      function goToNow() {
        const now = new Date();
        const nowHour = now.getHours();
        const nowMinute = Math.floor(now.getMinutes() / ${minuteInterval}) * ${minuteInterval};
        
        const targetHourIndex = ${JSON.stringify(hours)}.indexOf(${use24Hour ? 'nowHour' : '(nowHour % 12 === 0 ? 12 : nowHour % 12)'});
        const targetMinuteIndex = ${JSON.stringify(minutes)}.indexOf(nowMinute);
        
        if (targetHourIndex !== -1) emblaHour.scrollTo(targetHourIndex + ${paddingItems.length});
        if (targetMinuteIndex !== -1) emblaMinute.scrollTo(targetMinuteIndex + ${paddingItems.length});
        
        ${!use24Hour ? `
          if (nowHour >= 12) emblaAmPm.scrollTo(1);
          else emblaAmPm.scrollTo(0);
        ` : ''}
        
        setTimeout(() => updateTime(), 300);
      }
      
      function setValue(timeStr) {
        if (!timeStr) return;
        
        function doSetValue() {
          if (!emblaHour || !emblaMinute) {
            setTimeout(doSetValue, 50);
            return;
          }
          
          const parts = timeStr.split(':');
          const targetHour = parseInt(parts[0]);
          const targetMinute = parseInt(parts[1]);
          
          const targetHourIndex = ${JSON.stringify(hours)}.indexOf(${use24Hour ? 'targetHour' : '(targetHour % 12 === 0 ? 12 : targetHour % 12)'});
          const targetMinuteIndex = ${JSON.stringify(minutes)}.indexOf(targetMinute);
          
          if (targetHourIndex !== -1) emblaHour.scrollTo(targetHourIndex + ${paddingItems.length});
          if (targetMinuteIndex !== -1) emblaMinute.scrollTo(targetMinuteIndex + ${paddingItems.length});
          
          ${!use24Hour ? `
            if (!emblaAmPm) {
              setTimeout(doSetValue, 50);
              return;
            }
            if (targetHour >= 12) emblaAmPm.scrollTo(1);
            else emblaAmPm.scrollTo(0);
          ` : ''}
          
          setTimeout(() => updateTime(), 300);
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
      skeleton={skeleton}
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
            .timepicker-embla {
              overflow: hidden;
              width: 100%;
            }
            .timepicker-embla__container {
              display: flex;
              flex-direction: column;
              touch-action: pan-y pinch-zoom;
              height: 100%;
            }
            .timepicker-embla__slide {
              flex: 0 0 ${config.slideHeight}px;
              min-width: 0;
              height: ${config.slideHeight}px;
            }
            .timepicker-highlight {
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
            .timepicker-embla__slide.is-selected > div {
              font-weight: 600;
            }
          `}
        </style>
        
        <div class="flex gap-4 w-full">
          <div class="relative flex-1">
            <div class="relative" style={{ height: `${config.height}px` }}>
              <div class="timepicker-highlight"></div>
              <div x-ref="hourContainer" class="timepicker-embla h-full">
                <div class="timepicker-embla__container h-full">
                  {paddingItems.map((_, i) => (
                    <div class="timepicker-embla__slide flex items-center justify-center" key={`hour-pad-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                  {hours.map(hour => (
                    <div class="timepicker-embla__slide flex items-center justify-center" key={hour}>
                      <div style={{ fontSize: config.fontSize, opacity: 0.6 }}>{String(hour).padStart(2, '0')}</div>
                    </div>
                  ))}
                  {paddingItems.map((_, i) => (
                    <div class="timepicker-embla__slide flex items-center justify-center" key={`hour-pad-end-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-center w-8" style={{ fontSize: config.labelSize, opacity: 0.7 }}>時</div>
          
          <div class="relative flex-1">
            <div class="relative" style={{ height: `${config.height}px` }}>
              <div class="timepicker-highlight"></div>
              <div x-ref="minuteContainer" class="timepicker-embla h-full">
                <div class="timepicker-embla__container h-full">
                  {paddingItems.map((_, i) => (
                    <div class="timepicker-embla__slide flex items-center justify-center" key={`minute-pad-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                  {minutes.map(minute => (
                    <div class="timepicker-embla__slide flex items-center justify-center" key={minute}>
                      <div style={{ fontSize: config.fontSize, opacity: 0.6 }}>{String(minute).padStart(2, '0')}</div>
                    </div>
                  ))}
                  {paddingItems.map((_, i) => (
                    <div class="timepicker-embla__slide flex items-center justify-center" key={`minute-pad-end-${i}`}>
                      <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-center w-8" style={{ fontSize: config.labelSize, opacity: 0.7 }}>分</div>
          
          {!use24Hour && (
            <div class="relative flex-1">
              <div class="relative" style={{ height: `${config.height}px` }}>
                <div class="timepicker-highlight"></div>
                <div x-ref="amPmContainer" class="timepicker-embla h-full">
                  <div class="timepicker-embla__container h-full">
                    {paddingItems.map((_, i) => (
                      <div class="timepicker-embla__slide flex items-center justify-center" key={`ampm-pad-${i}`}>
                        <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                      </div>
                    ))}
                    <div class="timepicker-embla__slide flex items-center justify-center" key="AM">
                      <div style={{ fontSize: config.fontSize, opacity: 0.6 }}>AM</div>
                    </div>
                    <div class="timepicker-embla__slide flex items-center justify-center" key="PM">
                      <div style={{ fontSize: config.fontSize, opacity: 0.6 }}>PM</div>
                    </div>
                    {paddingItems.map((_, i) => (
                      <div class="timepicker-embla__slide flex items-center justify-center" key={`ampm-pad-end-${i}`}>
                        <div style={{ fontSize: config.fontSize, opacity: 0 }}>-</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div class="mt-4">
          <Button
            variant={variant}
            color={color}
            className="w-full"
            onClick={`window.${instanceId} && window.${instanceId}.goToNow()`}
          >
            現在
          </Button>
        </div>
      </div>
    </Container>
  );
}
