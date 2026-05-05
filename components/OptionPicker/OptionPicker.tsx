import type { OptionPickerProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default async function OptionPicker({
  children,
  mode = 'single',
  selectedValues = [],
  onChange,
  variant = 'outline',
  color = 'primary',
  autoFill = true,
  gap = 'md',
  hover = true,
  padding = 'md',
  rounded = 'md',
  className = '',
  ...restProps
}: OptionPickerProps) {
  // 建立間距類別
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-xs',
    sm: 'gap-sm',
    md: 'gap-md',
    lg: 'gap-lg',
    xl: 'gap-xl'
  };

  // 處理子元件
  const childArray = Array.isArray(children) ? children : children ? [children] : [];

  // 渲染選項
  const optionContainers = await Promise.all(childArray.map(async (child, index) => {
    const childProps = (child as any).props || {};
    const value = childProps.value || `option-${index}`;
    const isDisabled = childProps.disabled || false;
    const isSelected = selectedValues.includes(value);

    // 使用 Container 渲染每個選項
    return await Container({
      variant,
      color,
      active: isSelected,
      hover: hover && !isDisabled,
      padding,
      rounded,
      align: 'center',
      justify: 'center',
      direction: 'column',
      className: [
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        autoFill ? 'flex-1' : ''
      ].filter(Boolean).join(' '),
      onClick: () => {
        if (isDisabled) return;
        if (mode === 'single') {
          onChange?.([value]);
        } else {
          const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
          onChange?.(newValues);
        }
      },
      children: childProps.children
    });
  }));

  return (
    <div 
      class={`flex flex-wrap ${gapClasses[gap]} ${className}`}
      {...restProps}
    >
      {optionContainers}
    </div>
  );
}