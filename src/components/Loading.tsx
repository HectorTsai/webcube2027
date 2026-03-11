interface LoadingProps {
  風格?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  內容?: string
}

export default async function Loading({ 
  風格 = 'spinner', 
  內容 
}: LoadingProps) {
  try {
    // 1. 如果有傳入自定義 SVG 內容，直接使用
    if (內容 && 內容.includes('<svg')) {
      return <span dangerouslySetInnerHTML={{ __html: 內容 }} />
    }
    
    // 2. 否則嘗試從檔案載入預設風格
    const svgPath = new URL(`./loadings/${風格}.svg`, import.meta.url)
    const svgContent = await Deno.readTextFile(svgPath)
    
    return <span dangerouslySetInnerHTML={{ __html: svgContent }} />
  } catch (_e) {
    // 3. 後備方案：CSS 動畫
    return (
      <span className="inline-block animate-spin">
        <div className="w-4 h-4 border-2 border-slate-700 rounded-full border-t-transparent"></div>
      </span>
    )
  }
}
