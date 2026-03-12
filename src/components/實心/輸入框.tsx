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

export default function 實心輸入框({ 
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
    主要: 'border-主色 focus:border-主色/80 focus:ring-主色/20',
    次要: 'border-次要 focus:border-次要/80 focus:ring-次要/20',
    成功: 'border-成功 focus:border-成功/80 focus:ring-成功/20',
    警告: 'border-警告 focus:border-警告/80 focus:ring-警告/20',
    錯誤: 'border-錯誤 focus:border-錯誤/80 focus:ring-錯誤/20',
    資訊: 'border-資訊 focus:border-資訊/80 focus:ring-資訊/20'
  }
  
  const 尺寸類別 = {
    小: 'px-3 py-2 text-sm',
    中: 'px-4 py-3 text-base',
    大: 'px-5 py-4 text-lg'
  }

  const 狀態類別 = 禁用 
    ? 'bg-背景2/50 cursor-not-allowed opacity-50' 
    : 'bg-背景1 hover:bg-背景1/80 focus:bg-背景1'

  return (
    <div className={`實心輸入框 ${className}`}>
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
            w-full rounded-lg border-2 transition-all duration-200
            ${顏色類別[顏色]}
            ${尺寸類別[尺寸]}
            ${狀態類別}
            ${前綴圖示 ? 'pl-10' : ''}
            ${後綴圖示 ? 'pr-10' : ''}
            outline-none focus:ring-2
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
