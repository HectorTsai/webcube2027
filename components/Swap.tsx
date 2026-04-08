import Icon from './Icon/index.tsx';

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
}: SwapProps) {
  const inputProps: Record<string, unknown> = {
    type: 'checkbox',
    class: 'peer swap-toggle sr-only',
    name,
    value,
    disabled,
    'aria-label': label,
  };

  if (typeof checked === 'boolean') {
    inputProps.checked = checked;
  } else if (typeof defaultChecked === 'boolean') {
    inputProps.defaultChecked = defaultChecked;
  }

  const baseFace = cx(
    'swap-face col-start-1 row-start-1 inline-flex items-center justify-center pointer-events-none transition origin-center',
    durationClass,
  );
  const fromFace = cx(
    baseFace,
    'opacity-100',
    'peer-checked:opacity-0',
    'animate-in',
    animateIn,
    'peer-checked:animate-out',
    animateOut && `peer-checked:${animateOut}`,
  );

  const toFace = cx(
    baseFace,
    'opacity-0',
    'peer-checked:opacity-100',
    'animate-out',
    animateOut,
    'peer-checked:animate-in',
    animateIn && `peer-checked:${animateIn}`,
  );

  const fromIcon = await Icon({ id: fromId, svg: fromSvg, src: fromSrc, size, className: fromFace });
  const toIcon = await Icon({ id: toId, svg: toSvg, src: toSrc, size, className: toFace });

  return (
    <label class={cx('swap-root inline-flex items-center justify-center cursor-pointer', disabled && 'opacity-60 cursor-not-allowed', wrapperClassName)}>
      <input {...inputProps} />
      <div class={cx('swap-stack inline-grid place-items-center', className)}>
        {fromIcon}
        {toIcon}
      </div>
    </label>
  );
}
