import type { Context } from 'hono'

/** Blog Layout - 只影響 blog 相關路由 */
export default function BlogLayout(Component: () => unknown, _ctx: Context) {
  return (
    <div className="blog-layout">
      {/* Blog 專用導航 */}
      <header className="border-b border-purple-800 bg-purple-900/50">
        <nav className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-purple-400">📝 Blog</h1>
            <div className="flex gap-4">
              <a href="/blog" className="text-purple-300 hover:text-purple-200">首頁</a>
              <a href="/blog/posts" className="text-purple-300 hover:text-purple-200">文章</a>
              <a href="/" className="text-purple-300 hover:text-purple-200">返回主站</a>
            </div>
          </div>
        </nav>
      </header>

      {/* Blog 主要內容 */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 p-4 rounded-lg bg-purple-900/20 border border-purple-800">
          <p className="text-purple-300 text-sm">🎯 這是 Blog 專用 Layout，只會包裝 blog 相關路由</p>
        </div>
        {Component()}
      </main>
    </div>
  )
}
