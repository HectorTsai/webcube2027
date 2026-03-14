#!/usr/bin/env deno run --allow-net --allow-read --allow-env --allow-write --unstable-kv

import { jsx } from 'hono/jsx'
import { Context } from 'hono'

// 測試：讀取佈局檔案並轉換為 JSX
async function testLayoutStringToJSX() {
  try {
    console.log('🧪 開始測試佈局字串轉 JSX...')
    
    // 1. 讀取佈局檔案
    const layoutPath = './src/components/佈局/經典.tsx'
    const layoutString = await Deno.readTextFile(layoutPath)
    
    console.log('📁 成功讀取佈局檔案')
    console.log('📄 檔案內容長度:', layoutString.length, '字元')
    
    // 2. 使用 Hono 內建 JSX 轉換
    console.log('🔄 開始 JSX 轉換...')
    const LayoutComponent = jsx(layoutString)
    
    console.log('✅ JSX 轉換成功')
    console.log('📝 轉換結果類型:', typeof LayoutComponent)
    console.log('📋 轉換結果內容:', LayoutComponent)
    console.log('📋 轉換結果 constructor:', LayoutComponent?.constructor?.name)
    console.log('📋 是否為函數:', typeof LayoutComponent === 'function')
    
    // 3. 測試渲染（模擬 Context）
    const mockContext = {
      req: { header: () => '' },
      render: (content: any) => content
    } as Context
    
    const mockChildren = <div>測試內容</div>
    
    console.log('🎨 開始測試渲染...')
    const result = await LayoutComponent({ 
      children: mockChildren, 
      風格: '經典', 
      baseURL: 'http://localhost:8000' 
    }, mockContext)
    
    console.log('✅ 渲染成功')
    console.log('📊 渲染結果類型:', typeof result)
    
    // 4. 檢查結果
    if (result && typeof result === 'object') {
      console.log('🎉 測試成功！佈局字串可以轉換為 JSX')
      return true
    } else {
      console.log('❌ 測試失敗：渲染結果不符合預期')
      console.log('📋 實際結果:', result)
      return false
    }
    
  } catch (error) {
    console.error('💥 測試失敗:', error)
    console.error('📋 錯誤詳情:', error.message)
    console.error('📋 錯誤堆疊:', error.stack)
    return false
  }
}

// 執行測試
if (import.meta.main) {
  const success = await testLayoutStringToJSX()
  
  if (success) {
    console.log('\n🎉 結論：Hono 內建的 JSX 轉換可以處理佈局字串！')
    console.log('💡 這意味著我們可能不需要複雜的 RadiX UI + Emotion 架構')
    console.log('🚀 可以考慮統一使用 Hono JSX 轉換方案')
  } else {
    console.log('\n❌ 結論：Hono JSX 轉換無法處理複雜佈局')
    console.log('📋 需要繼續原計劃：RadiX UI + Emotion + CSS Variables')
    console.log('🔧 這驗證了新架構的必要性')
  }
  
  Deno.exit(success ? 0 : 1)
}
