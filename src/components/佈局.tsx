interface 佈局Props {
  佈局: string
  風格: string
  children: unknown
  baseURL: string
}

export default async function 佈局({ 佈局, 風格, children, baseURL }: 佈局Props) {
  // 測試階段：直接使用 JSON 佈局系統
  try {
    // 呼叫 API 獲取佈局配置
    const response = await fetch(`${baseURL}/api/layout`)
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || '獲取佈局配置失敗')
    }
    
    // 動態導入 JSON 佈局渲染器
    const { default: JSONLayout } = await import('./JSONLayoutRenderer.tsx')
    
    // 設定插槽內容（包含頁尾）
    const slots = {
      'footer-content': await import('./頁尾.tsx').then(m => 
        m.default({ 風格, 版權: "© 2026 WebCube2027. 版權 所有.", 連結: [
          { 標籤: '首頁', 連結: '/' },
          { 標籤: '關於', 連結: '/about' },
          { 標籤: '文件', 連結: '/docs' }
        ], 顏色: "主要" })
        )
    }
    
    return <JSONLayout layoutConfig={result.layout} slots={slots}>
      {children}
    </JSONLayout>
  } catch (error) {
    console.error('JSON 佈局錯誤:', error)
    // 失敗時回退到經典佈局
    const LayoutComponent = (await import('./佈局/經典.tsx')).default
    return <LayoutComponent 風格={風格} baseURL={baseURL}>{children}</LayoutComponent>
  }
}
