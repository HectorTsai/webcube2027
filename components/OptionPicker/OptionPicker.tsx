import { ComponentProps } from '../classes.ts';

export interface OptionItem {
  /** 選項值 */
  value: string;
  /** 選項內容（可以是文字、圖示、圖片、影片等） */
  content: any;
  /** 是否預設選中 */
  selected?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface OptionPickerProps extends ComponentProps {
  /** 選項列表 */
  options: OptionItem[];
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
  /** 網格列數 */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 'auto';
  /** 間距 */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 是否啟用 hover 效果 */
  hover?: boolean;
  /** 容器內距 */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 容器圓角 */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export default function OptionPicker({
  options = [],
  mode = 'single',
  selectedValues = [],
  onChange,
  variant = 'outline',
  color = 'primary',
  cols = 3,
  gap = 'md',
  hover = true,
  padding = 'md',
  rounded = 'lg',
  className = '',
  ...restProps
}: OptionPickerProps) {
  // 處理選項點擊
  const handleOptionClick = (value: string, disabled?: boolean) => {
    if (disabled) return;

    if (mode === 'single') {
      // 單選模式：只選中當前選項
      onChange?.([value]);
    } else {
      // 多選模式：切換選中狀態
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onChange?.(newValues);
    }
  };

  // 建立網格列數類別
  const gridColsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
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

  // 建立容器類別
  const getContainerClasses = (isSelected: boolean, isDisabled: boolean) => {
    const baseClasses = [
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'cursor-pointer',
      'transition-all',
      'duration-200',
      'box-border',
      padding ? `p-${padding}` : 'p-md',
      rounded ? `rounded-${rounded}` : 'rounded-lg',
      gapClasses[gap]
    ];

    if (isDisabled) {
      return [...baseClasses, 'opacity-50', 'cursor-not-allowed', 'bg-base-50', 'text-base-content'].filter(Boolean).join(' ');
    }

    if (isSelected) {
      return [...baseClasses, `bg-${color}`, `text-${color}-content`, `border-2`, `border-${color}`, hover ? `hover:bg-${color}-70` : ''].filter(Boolean).join(' ');
    }

    return [...baseClasses, 'bg-base', 'text-base-content', `border-2`, `border-${color}`, hover ? `hover:bg-${color}-10` : ''].filter(Boolean).join(' ');
  };

  return (
    <div 
      className={`grid ${gridColsClasses[cols]} ${gapClasses[gap]} ${className}`}
      {...restProps}
    >
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        const isDisabled = option.disabled || false;

        return (
          <div
            key={option.value}
            className={getContainerClasses(isSelected, isDisabled)}
            onClick={() => handleOptionClick(option.value, isDisabled)}
          >
            {option.content}
          </div>
        );
      })}
    </div>
  );
}