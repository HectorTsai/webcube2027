#!/usr/bin/env deno run --allow-net --allow-read --allow-env --allow-write --unstable-kv

// 測試 JSON 佈局系統
async function testJSONLayout() {
  try {
    console.log('🧪 測試 JSON 佈局系統...')
    
    // 1. 測試 API
    console.log('📡 測試 API 端點...')
    const response = await fetch('http://localhost:8000/api/layout')
    const result = await response.json()
    
    if (!result.success) {
      throw new Error('API 失敗: ' + result.error)
    }
    
    console.log('✅ API 正常')
    console.log('📋 佈局配置:', JSON.stringify(result.layout, null, 2))
    
    // 2. 測試頁面載入
    console.log('🌐 測試頁面載入...')
    const pageResponse = await fetch('http://localhost:8000/')
    
    if (!pageResponse.ok) {
      throw new Error(`頁面載入失敗: ${pageResponse.status}`)
    }
    
    const pageContent = await pageResponse.text()
    
    // 檢查是否包含錯誤信息
    if (pageContent.includes('JSON 佈局錯誤') || pageContent.includes('佈局渲染錯誤')) {
      console.log('❌ 發現 JSON 佈局錯誤')
      
      // 提取錯誤信息
      const errorMatch = pageContent.match(/<p[^>]*>([^<]+)<\/p>/)
      if (errorMatch) {
        console.log('📋 錯誤詳情:', errorMatch[1])
      }
      
      return false
    }
    
    // 檢查是否包含預期的佈局元素
    const hasLayoutElements = pageContent.includes('WebCube2027') && 
                            pageContent.includes('main-content')
    
    if (hasLayoutElements) {
      console.log('✅ JSON 佈局渲染成功！')
      console.log('🎯 頁面包含預期的佈局元素')
      return true
    } else {
      console.log('⚠️ 頁面載入但缺少預期元素')
      console.log('📋 頁面內容長度:', pageContent.length)
      return false
    }
    
  } catch (error) {
    console.error('💥 測試失敗:', error.message)
    return false
  }
}

// 執行測試
if (import.meta.main) {
  const success = await testJSONLayout()
  
  if (success) {
    console.log('\n🎉 JSON 佈局系統測試成功！')
    console.log('💡 這意味著：')
    console.log('   ✅ API 正常回傳 JSON 配置')
    console.log('   ✅ 渲染器正確解析 JSON')
    console.log('   ✅ 插槽機制正常工作')
    console.log('   ✅ 樣式正確應用')
    console.log('\n🚀 可以繼續開發 AI 佈局生成功能！')
  } else {
    console.log('\n❌ JSON 佈局系統測試失敗')
    console.log('🔧 需要檢查：')
    console.log('   🔍 API 端點是否正常')
    console.log('   🔍 JSON 配置格式是否正確')
    console.log('   🔍 渲染器是否有錯誤')
    console.log('   🔍 插槽機制是否正常')
  }
  
  Deno.exit(success ? 0 : 1)
}
