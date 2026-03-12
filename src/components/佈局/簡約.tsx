import 頁尾 from '../頁尾.tsx'

interface 簡約佈局Props {
  children: unknown
  風格: string
  baseURL: string
}

export default async function 簡約佈局({ children, 風格, baseURL }: 簡約佈局Props) {
  // 預載入頁尾元件
  const 頁尾元件 = await 頁尾({ 風格, 版權: "© 2026 WebCube2027. 版權所有. - 簡約設計", 連結: [
    { 標籤: '首頁', 連結: '/' },
    { 標籤: '關於', 連結: '/about' }
  ], 顏色: "次要" })

  return (
    <div className="min-h-screen bg-背景1 text-背景內容 flex flex-col">
      <div className="webcube-容器 py-8 flex-1">
        <div className="webcube-卡片">
          {children}
        </div>
      </div>
      {頁尾元件}
    </div>
  )
}
