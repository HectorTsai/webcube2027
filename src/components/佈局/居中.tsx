import 頁尾 from '../頁尾.tsx'

interface 居中佈局Props {
  children: unknown
  風格: string
  baseURL: string
}

export default async function 居中佈局({ children, 風格, baseURL }: 居中佈局Props) {
  // 預載入頁尾元件
  const 頁尾元件 = await 頁尾({ 風格, 版權: "© 2026 WebCube2027. 版權所有. - 居中設計", 連結: [
    { 標籤: '首頁', 連結: '/' },
    { 標籤: '關於', 連結: '/about' }
  ], 顏色: "資訊" })

  return (
    <div className="min-h-screen bg-背景1 text-背景內容 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="webcube-容器">
          <div className="webcube-卡片 max-w-2xl">
            {children}
          </div>
        </div>
      </div>
      {頁尾元件}
    </div>
  )
}
