export default function 首頁() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="webcube-標題">WebCube2027 檔案路由器</h1>
        <p className="webcube-文字 mt-4">
          這是透過檔案路由器自動載入的首頁，支援特殊檔案：
        </p>
      </section>

      <section className="webcube-卡片">
        <h2 className="webcube-副標題">特殊檔案功能</h2>
        <ul className="webcube-文字 space-y-2">
          <li>✅ <code className="圓角-欄位 bg-背景3 px-2 py-1 font-mono text-sm">_app.tsx</code> - 全域 App 包裝器</li>
          <li>✅ <code className="圓角-欄位 bg-背景3 px-2 py-1 font-mono text-sm">_layout.tsx</code> - 統一佈局</li>
          <li>✅ <code className="圓角-欄位 bg-背景3 px-2 py-1 font-mono text-sm">_middleware.tsx</code> - 全域中間件</li>
          <li>✅ <code className="圓角-欄位 bg-背景3 px-2 py-1 font-mono text-sm">_404.tsx</code> - 404 錯誤頁面</li>
          <li>✅ <code className="圓角-欄位 bg-背景3 px-2 py-1 font-mono text-sm">_error.tsx</code> - 錯誤處理器</li>
          <li>✅ <code className="圓角-欄位 bg-背景3 px-2 py-1 font-mono text-sm">_500.tsx</code> - 500 錯誤頁面</li>
        </ul>
      </section>

      <section>
        <h2 className="webcube-副標題 mb-4">測試路由</h2>
        <div className="webcube-網格">
          <a href="/about" className="webcube-按鈕 block">
            → 關於我們
          </a>
          <a href="/users/jason" className="webcube-按鈕 block">
            → 使用者頁面（動態路由）
          </a>
          <a href="/blog" className="webcube-按鈕 block">
            → Blog 首頁（巢狀路由）
          </a>
          <a href="/_routes" className="webcube-按鈕 block">
            → 查看所有路由（除錯）
          </a>
        </div>
      </section>

      <section className="webcube-卡片 border-成功色 bg-成功色/10">
        <h2 className="text-成功色 webcube-副標題">🚀 內部重導向測試</h2>
        <div className="webcube-網格">
          <a href="/admin" className="webcube-按鈕次 block">
            → 管理面板（無權限 → 內部重導向到登入）
          </a>
          <a href="/admin/profile" className="webcube-按鈕次 block">
            → 個人資料（巢狀重導向測試）
          </a>
        </div>
        <p className="webcube-描述 text-成功色 mt-2">
          💡 內部重導向不會重新發送 HTTP 請求，效能更高！
        </p>
      </section>

      {/* 主題展示區 */}
      <section className="webcube-卡片">
        <h2 className="webcube-副標題">🎨 主題展示</h2>
        <div className="webcube-網格">
          <div className="webcube-卡片 relative" style={{backgroundColor: 'oklch(59.67% 0.221 258.03)', color: 'white'}}>
            <h3 className="font-bold">主色展示</h3>
            <p>這是主色區塊</p>
          </div>
          <div className="webcube-卡片 relative" style={{backgroundColor: 'oklch(39.24% 0.128 255)', color: 'white'}}>
            <h3 className="font-bold">次色展示</h3>
            <p>這是次色區塊</p>
          </div>
          <div className="webcube-卡片 relative" style={{backgroundColor: 'oklch(77.86% 0.1489 226.0173)', color: 'black'}}>
            <h3 className="font-bold">強調色展示</h3>
            <p>這是強調色區塊</p>
          </div>
        </div>
        <div className="webcube-彈性 mt-4">
          <button className="webcube-按鈕">主要按鈕</button>
          <button className="webcube-按鈕次">次要按鈕</button>
          <button className="bg-資訊色 text-資訊色內容 px-4 py-2 圓角-欄位">資訊按鈕</button>
          <button className="bg-成功色 text-成功色內容 px-4 py-2 圓角-欄位">成功按鈕</button>
          <button className="bg-警告色 text-警告色內容 px-4 py-2 圓角-欄位">警告按鈕</button>
          <button className="bg-錯誤色 text-錯誤色內容 px-4 py-2 圓角-欄位">錯誤按鈕</button>
        </div>
      </section>
    </div>
  )
}
