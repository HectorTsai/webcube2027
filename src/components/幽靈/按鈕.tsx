interface ButtonProps {
  children: string
  顏色?: '主要' | '次要' | '成功' | '警告' | '錯誤' | '資訊'
  尺寸?: '小' | '中' | '大'
  禁用?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
}

export default function Button({ 
  children, 
  顏色 = '主要', 
  尺寸 = '中', 
  禁用 = false,
  type = 'button',
  onClick,
  className = ''
}: ButtonProps) {
  const 顏色類別 = {
    主要: '文字-主色 hover:背景-主色 hover:文字-主色內容 focus:ring-2 focus:ring-主色',
    次要: '文字-次色 hover:背景-次色 hover:文字-次色內容 focus:ring-2 focus:ring-次色',
    成功: '文字-成功色 hover:背景-成功色 hover:文字-成功色內容 focus:ring-2 focus:ring-成功色',
    警告: '文字-警告色 hover:背景-警告色 hover:文字-警告色內容 focus:ring-2 focus:ring-警告色',
    錯誤: '文字-錯誤色 hover:背景-錯誤色 hover:文字-錯誤色內容 focus:ring-2 focus:ring-錯誤色',
    資訊: '文字-資訊色 hover:背景-資訊色 hover:文字-資訊色內容 focus:ring-2 focus:ring-資訊色'
  }

  const 尺寸類別 = {
    小: 'px-3 py-1.5 text-sm',
    中: 'px-4 py-2 text-sm',
    大: 'px-6 py-3 text-base'
  }

  const 禁用類別 = 禁用 ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      type={type}
      disabled={禁用}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-medium 圓角-欄位
        focus:outline-none transition-all duration-200
        ${顏色類別[顏色]}
        ${尺寸類別[尺寸]}
        ${禁用類別}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
