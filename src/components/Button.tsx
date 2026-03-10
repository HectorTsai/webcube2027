interface ButtonProps {
  children: string
  風格?: '主要' | '次要' | '成功' | '警告' | '錯誤' | '資訊' | '線框' | '幽靈'
  尺寸?: '小' | '中' | '大'
  禁用?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
}

export function Button({ 
  children, 
  風格 = '主要', 
  尺寸 = '中', 
  禁用 = false,
  type = 'button',
  onClick,
  className = ''
}: ButtonProps) {
  const 風格類別 = {
    主要: '背景-主色 文字-主色內容 hover:opacity-90 focus:ring-2 focus:ring-主色',
    次要: '背景-次色 文字-次色內容 hover:opacity-90 focus:ring-2 focus:ring-次色',
    成功: '背景-成功色 文字-成功色內容 hover:opacity-90 focus:ring-2 focus:ring-成功色',
    警告: '背景-警告色 文字-警告色內容 hover:opacity-90 focus:ring-2 focus:ring-警告色',
    錯誤: '背景-錯誤色 文字-錯誤色內容 hover:opacity-90 focus:ring-2 focus:ring-錯誤色',
    資訊: '背景-資訊色 文字-資訊色內容 hover:opacity-90 focus:ring-2 focus:ring-資訊色',
    線框: 'border border-邊框-背景3 文字-背景內容 背景背景-1 hover:背景-背景2 focus:ring-2 focus:ring-主色',
    幽靈: '文字-背景內容 hover:背景-背景2 focus:ring-2 focus:ring-中性色'
  }

  const 尺寸樣式 = {
    小: 'px-3 py-1.5 text-sm',
    中: 'px-4 py-2 text-sm',
    大: 'px-6 py-3 text-base'
  }

  const 禁用樣式 = 禁用 ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      type={type}
      disabled={禁用}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-medium 圓角-欄位
        focus:outline-none transition-all duration-200
        ${風格類別[風格]}
        ${尺寸樣式[尺寸]}
        ${禁用樣式}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export default Button
