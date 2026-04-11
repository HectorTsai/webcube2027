import Icon from './Icon.tsx';

type IconSize = Parameters<typeof Icon>[0]['size'];

export interface SwapProps {
  fromId?: string;
  toId?: string;
  fromSvg?: string;
  toSvg?: string;
  fromSrc?: string;
  toSrc?: string;
  animateIn?: string;
  animateOut?: string;
  size?: IconSize;
  className?: string;
  wrapperClassName?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
  durationClass?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

const cx = (...parts: Array<string | undefined | null | false>) => parts.filter(Boolean).join(' ');

export default async function Swap({
  fromId,
  toId,
  fromSvg,
  toSvg,
  fromSrc,
  toSrc,
  animateIn = 'fade-in',
  animateOut = 'fade-out',
  size = 'md',
  className,
  wrapperClassName,
  name,
  value,
  checked,
  defaultChecked,
  disabled,
  label,
  durationClass = 'duration-700',
  ...restProps
}: SwapProps) {
  const isChecked = typeof checked === 'boolean' ? checked : (defaultChecked ?? false);
  
  const baseClasses = cx(
    'swap-stack inline-grid place-items-center col-start-1 row-start-1',
    'transition-all',
    "absolute",
    className
  );

  return (
    <label 
      class={cx('swap-root inline-flex items-center justify-center cursor-pointer', disabled && 'opacity-60 cursor-not-allowed', wrapperClassName)}
      x-data={`{ checked: ${isChecked}, toggle() { this.checked = !this.checked; $el.querySelector('input').checked = this.checked; } }`}
      {...restProps}
    >
      <input 
        type="checkbox" 
        class="sr-only"
        name={name}
        value={value}
        disabled={disabled}
        aria-label={label}
        checked={isChecked}
        x-ref="checkbox"
        x-on:change="checked = $event.target.checked"
      />
      
      {/* from: checked 時播放退場動畫，然後隱藏 */}
      {await Icon({ 
        id: fromId, 
        svg: fromSvg, 
        src: fromSrc, 
        size,
        className: cx(baseClasses, durationClass),
        'x-show': '!checked',
        'x-transition:enter': `animate-in ${animateIn}`,
        'x-transition:enter-start': 'opacity-0',
        'x-transition:enter-end': 'opacity-100',
        'x-transition:leave': `animate-out ${animateOut}`,
        'x-transition:leave-start': 'opacity-100',
        'x-transition:leave-end': 'opacity-0',
      })}

      {/* to: checked 時顯示並播放入場動畫 */}
      {await Icon({ 
        id: toId, 
        svg: toSvg, 
        src: toSrc, 
        size,
        className: cx(baseClasses, durationClass),
        'x-show': 'checked',
        'x-transition:enter': `animate-in ${animateIn}`,
        'x-transition:enter-start': 'opacity-0',
        'x-transition:enter-end': 'opacity-100',
        'x-transition:leave': `animate-out ${animateOut}`,
        'x-transition:leave-start': 'opacity-100',
        'x-transition:leave-end': 'opacity-0',
      })}
    </label>
  );
}
