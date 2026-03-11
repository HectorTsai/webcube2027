export default function 關於() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-cyan-400">關於 WebCube2027</h1>
        <div className="mt-6 space-y-4 text-slate-300">
          <p>
            WebCube2027 是一個基於 Deno + Hono 的多站點網站生成器，
            採用自行設計的檔案路由器實現自動路由管理。
          </p>
        </div>
      </section>

      {/* WebCube 樣式測試 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-cyan-300">WebCube 樣式測試</h2>
        
        {/* 測試中文顏色類別 */}
        <div className="背景-主色 p-4 rounded-lg">
          <p className="文字-主色內容">背景-主色 + 文字-主色內容</p>
        </div>
        
        <div className="背景-次色 p-4 rounded-lg">
          <p className="文字-次色內容">背景-次色 + 文字-次色內容</p>
        </div>
        
        <div className="背景-強調色 p-4 rounded-lg">
          <p className="文字-強調色內容">背景-強調色 + 文字-強調色內容</p>
        </div>
        
        {/* 測試 UnoCSS 基礎類別 */}
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <p>標準 UnoCSS: bg-blue-500 + text-white</p>
        </div>
        
        <div className="bg-green-500 text-white p-4 rounded-lg">
          <p>標準 UnoCSS: bg-green-500 + text-white</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-cyan-300">技術棧</h2>
        <ul className="mt-2 list-disc list-inside space-y-1 text-slate-200">
          <li>Deno 2.x - 運行時環境</li>
          <li>Hono - 輕量級 Web 框架</li>
          <li>UnoCSS - 原子化 CSS 框架</li>
          <li>自研檔案路由器 - 自動路由管理</li>
        </ul>
      </section>

      <section>
        <nav className="pt-4">
          <a href="/" className="text-cyan-300 hover:text-cyan-200">
            ← 返回首頁
          </a>
        </nav>
      </section>
    </div>
  )
}
