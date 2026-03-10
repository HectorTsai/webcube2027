import 實心按鈕 from './實心/Button.tsx'

interface ButtonProps {
  children: string
  顏色?: '主要' | '次要' | '成功' | '警告' | '錯誤' | '資訊'
  尺寸?: '小' | '中' | '大'
  禁用?: boolean
  風格: string // 必要參數，從 route 傳入
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
}

export default async function Button({ 風格, ...props }: ButtonProps) {
  // 使用靜態 import 但保持模組化架構
  // 這樣避免了異步問題，同時保持了職責分離
  
  try {
    const Button = (await import(`./${風格}/Button.tsx`)).default;
      return <Button {...props} />
  } catch (_e) {
      return <實心按鈕 {...props} />
  }
}
