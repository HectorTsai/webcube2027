import 經典佈局 from './佈局/經典.tsx'
import 簡約佈局 from './佈局/簡約.tsx'
import 居中佈局 from './佈局/居中.tsx'

interface 佈局Props {
  風格: string
  children: unknown
}

// 佈局風格對應表
const 佈局風格表 = {
  經典: 經典佈局,
  簡約: 簡約佈局,
  居中: 居中佈局,
  classic: 經典佈局,
  minimal: 簡約佈局,
  centered: 居中佈局
}

export default function 佈局({ 風格, children }: 佈局Props) {
  // 根據風格選擇對應的佈局元件，預設使用經典
  const LayoutComponent = 佈局風格表[風格 as keyof typeof 佈局風格表] || 經典佈局
  
  return <LayoutComponent>{children}</LayoutComponent>
}
