interface CheckboxProps {
  checked?: boolean
  label?: string
  顏色?: '主要' | '次要' | '成功' | '警告' | '錯誤' | '資訊'
  尺寸?: '小' | '中' | '大'
  禁用?: boolean
  必填?: boolean
  錯誤訊息?: string
  onChange?: (checked: boolean) => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
}

export default function 幽靈核取框({ 
  checked = false, 
  label = '', 
  顏色 = '主要', 
  尺寸 = '中', 
  禁用 = false,
  必填 = false,
  錯誤訊息 = '',
  onChange,
  onFocus,
  onBlur,
  className = ''
}: CheckboxProps) {
  const 顏色類別 = {
    主要: 'border-主色 text-主色 hover:bg-主色/10 focus:bg-主色/20',
    次要: 'border-次要 text-次要 hover:bg-次要/10 focus:bg-次要/20',
    成功: 'border-成功 text-成功 hover:bg-成功/10 focus:bg-成功/20',
    警告: 'border-警告 text-警告 hover:bg-警告/10 focus:bg-警告/20',
    錯誤: 'border-錯誤 text-錯誤 hover:bg-錯誤/10 focus:bg-錯誤/20',
    資訊: 'border-資訊 text-資訊 hover:bg-資訊/10 focus:bg-資訊/20'
  }
  
  const 尺寸類別 = {
    小: 'w-4 h-4 text-sm',
    中: 'w-5 h-5 text-base',
    大: 'w-6 h-6 text-lg'
  }

  const 狀態類別 = 禁用 
    ? 'cursor-not-allowed opacity-50' 
    : 'cursor-pointer'

  return (
    <div className={`幽靈核取框 ${className}`}>
      <label className="flex items-start gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            disabled={禁用}
            required={必填}
            onChange={(e) => onChange?.(e.target.checked)}
            onFocus={onFocus}
            onBlur={onBlur}
            className={`
              sr-only
            `}
          />
          
          <div 
            className={`
              ${尺寸類別[尺寸]}
              ${顏色類別[顏色]}
              ${狀態類別}
              rounded-md border-2 bg-transparent transition-all duration-200
              flex items-center justify-center
              ${checked ? 'ring-2 ring-offset-2' : ''}
            `}
          >
            {checked && (
              <svg className="w-3/4 h-3/4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        
        {label && (
          <span className={`text-背景內容 ${禁用 ? 'opacity-50' : ''} ${尺寸類別[尺寸].split(' ')[1]}`}>
            {label}
          </span>
        )}
      </label>
      
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
