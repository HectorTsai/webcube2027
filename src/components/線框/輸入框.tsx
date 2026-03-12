interface InputProps {
  value?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
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

export default function 線框輸入框({ 
  value = '', 
  placeholder = '請輸入內容', 
  type = 'text',
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
}: InputProps) {
  const 顏色類別 = {
    主要: 'border-主色 text-主色 hover:bg-主色/5 focus:border-主色/80 focus:bg-主色/10',
    次要: 'border-次要 text-次要 hover:bg-次要/5 focus:border-次要/80 focus:bg-次要/10',
    成功: 'border-成功 text-成功 hover:bg-成功/5 focus:border-成功/80 focus:bg-成功/10',
    警告: 'border-警告 text-警告 hover:bg-警告/5 focus:border-警告/80 focus:bg-警告/10',
    錯誤: 'border-錯誤 text-錯誤 hover:bg-錯誤/5 focus:border-錯誤/80 focus:bg-錯誤/10',
    資訊: 'border-資訊 text-資訊 hover:bg-資訊/5 focus:border-資訊/80 focus:bg-資訊/10'
  }
  
  const 尺寸類別 = {
    小: 'px-3 py-2 text-sm',
    中: 'px-4 py-3 text-base',
    大: 'px-5 py-4 text-lg'
  }

  const 狀態類別 = 禁用 
    ? 'cursor-not-allowed opacity-50' 
    : 'hover:bg-背景1/5'

  return (
    <div className={`線框輸入框 ${className}`}>
      <div className="relative">
        {前綴圖示 && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-背景內容/60">
            {前綴圖示}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={禁用}
          required={必填}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`
            w-full rounded-lg border-2 bg-transparent transition-all duration-200
            ${顏色類別[顏色]}
            ${尺寸類別[尺寸]}
            ${狀態類別}
            ${前綴圖示 ? 'pl-10' : ''}
            ${後綴圖示 ? 'pr-10' : ''}
            outline-none focus:ring-0
          `}
        />
        
        {後綴圖示 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-背景內容/60">
            {後綴圖示}
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
