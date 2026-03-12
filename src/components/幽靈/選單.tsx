interface SelectOption {
  value: string
  label: string
  icon?: string
  disabled?: boolean
}

interface SelectProps {
  value?: string
  placeholder?: string
  options: SelectOption[]
  顏色?: '主要' | '次要' | '成功' | '警告' | '錯誤' | '資訊'
  尺寸?: '小' | '中' | '大'
  禁用?: boolean
  必填?: boolean
  錯誤訊息?: string
  前綴圖示?: string
  後綴圖示?: string
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
}

export default function 幽靈選單({ 
  value = '', 
  placeholder = '請選擇選項', 
  options = [],
  顏色 = '主要', 
  尺寸 = '中', 
  禁用 = false,
  必填 = false,
  錯誤訊息 = '',
  前綴圖示 = '',
  後綴圖示 = '',
  onChange,
  onFocus,
  onBlur,
  className = ''
}: SelectProps) {
  const 顏色類別 = {
    主要: 'border-主色/20 text-主色 hover:border-主色/40 hover:bg-主色/5 focus:border-主色/60 focus:bg-主色/10 bg-transparent',
    次要: 'border-次要/20 text-次要 hover:border-次要/40 hover:bg-次要/5 focus:border-次要/60 focus:bg-次要/10 bg-transparent',
    成功: 'border-成功/20 text-成功 hover:border-成功/40 hover:bg-成功/5 focus:border-成功/60 focus:bg-成功/10 bg-transparent',
    警告: 'border-警告/20 text-警告 hover:border-警告/40 hover:bg-警告/5 focus:border-警告/60 focus:bg-警告/10 bg-transparent',
    錯誤: 'border-錯誤/20 text-錯誤 hover:border-錯誤/40 hover:bg-錯誤/5 focus:border-錯誤/60 focus:bg-錯誤/10 bg-transparent',
    資訊: 'border-資訊/20 text-資訊 hover:border-資訊/40 hover:bg-資訊/5 focus:border-資訊/60 focus:bg-資訊/10 bg-transparent'
  }
  
  const 尺寸類別 = {
    小: 'px-3 py-2 text-sm',
    中: 'px-4 py-3 text-base',
    大: 'px-5 py-4 text-lg'
  }

  const 狀態類別 = 禁用 
    ? 'cursor-not-allowed opacity-50' 
    : 'hover:bg-背景1/30'

  return (
    <div className={`幽靈選單 ${className}`}>
      <div className="relative">
        {前綴圖示 && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-背景內容/60">
            {前綴圖示}
          </div>
        )}
        
        <select
          value={value}
          disabled={禁用}
          required={必填}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`
            w-full rounded-lg border-2 transition-all duration-200 appearance-none
            ${顏色類別[顏色]}
            ${尺寸類別[尺寸]}
            ${狀態類別}
            ${前綴圖示 ? 'pl-10' : ''}
            ${後綴圖示 ? 'pr-10' : ''}
            outline-none focus:ring-0 cursor-pointer
          `}
        >
          <option value="" disabled className="bg-背景1 text-背景內容">
            {placeholder}
          </option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
              className="bg-背景1 text-背景內容"
            >
              {option.icon ? `${option.icon} ${option.label}` : option.label}
            </option>
          ))}
        </select>
        
        {後綴圖示 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-背景內容/60 pointer-events-none">
            {後綴圖示}
          </div>
        )}
        
        {/* 預設下拉箭頭 */}
        {!後綴圖示 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-背景內容/60 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
      
      {錯誤訊息 && (
        <div className="mt-1 text-sm text-錯誤">
          {錯誤訊息}
        </div>
      )}
      
      {必填 && !錯誤訊息 && (
        <div className="mt-1 text-xs text-背景內容/50">
          * 必填欄位
        </div>
      )}
    </div>
  )
}
