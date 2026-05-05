import Container from '../Container/index.tsx';

export interface OptionItem {
  /** 選項值 */
  value: string;
  /** 選項內容（可以是文字、圖示、圖片、影片等） */
  content: any;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface OptionPickerProps {
  /** 選項列表 */
  options?: OptionItem[];
  /** 選擇模式：single=單選(Radio), multiple=多選(Checkbox) */
  mode?: 'single' | 'multiple';
  /** 選中值列表 */
  selectedValues?: string[];
  /** 變更事件回調 */
  onChange?: (values: string[]) => void;
  /** 容器變體 */
  variant?: 'solid' | 'outline' | 'ghost' | 'dot' | 'dashed' | 'double' | 'gradient-right' | 'gradient-left' | 'gradient-up' | 'gradient-down' | 'gradient-middle' | 'gradient-diagonal' | 'gradient-center' | 'gradient-cone' | 'crystal' | 'diagonal-stripes' | 'glow' | 'minimalist';
  /** 容器顏色 */
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'base' | 'neutral';
  /** 是否自動填滿 */
  autoFill?: boolean;
  /** 間距 */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 是否啟用 hover 效果 */
  hover?: boolean;
  /** 容器內距 */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 容器圓角 */
  rounded?: 'none' | 'sm' | 'md' | 'lg';
  /** 額外 CSS 類別 */
  className?: string;
  /** 任意額外屬性 */
  [key: string]: any;
}

export default async function OptionPicker({
  options = [],
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
  // 處理選項點擊
  const handleOptionClick = (value: string, disabled?: boolean) => {
    if (disabled) return;

    if (mode === 'single') {
      onChange?.([value]);
    } else {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onChange?.(newValues);
    }
  };

  // 建立間距類別
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-xs',
    sm: 'gap-sm',
    md: 'gap-md',
    lg: 'gap-lg',
    xl: 'gap-xl'
  };

  // 渲染選項
  const optionContainers = await Promise.all(options.map(async (option) => {
    const isSelected = selectedValues.includes(option.value);
    const isDisabled = option.disabled || false;

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
        autoFill ? 'flex-1' : '',
        className
      ].filter(Boolean).join(' '),
      onClick: () => handleOptionClick(option.value, isDisabled),
      children: option.content
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