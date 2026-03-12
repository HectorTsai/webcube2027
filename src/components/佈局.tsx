interface 佈局Props {
  佈局: string
  風格: string
  children: unknown
  baseURL: string
}

// 佈局風格對應表
const 佈局風格表 = {
  經典: './佈局/經典.tsx',
  簡約: './佈局/簡約.tsx',
  居中: './佈局/居中.tsx',
  classic: './佈局/經典.tsx',
  minimal: './佈局/簡約.tsx',
  centered: './佈局/居中.tsx'
}

export default async function 佈局({ 佈局, 風格, children, baseURL }: 佈局Props) {
  // 根據佈局選擇對應的佈局元件路徑，預設使用經典
  const layoutPath = 佈局風格表[佈局 as keyof typeof 佈局風格表] || './佈局/經典.tsx'
  
  // 動態載入佈局元件
  const LayoutComponent = (await import(layoutPath)).default
  
  return <LayoutComponent 風格={風格} baseURL={baseURL}>{children}</LayoutComponent>
}
