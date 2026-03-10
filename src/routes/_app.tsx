import type { Context } from 'hono'

/** App 包裝器：包裝所有頁面的最外層 */
export default function App包裝器(Component: () => any, _ctx: Context) {
  return (
    <html lang="zh-Hant">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>WebCube2027</title>
        <link rel="stylesheet" href="/uno.css" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Component />
      </body>
    </html>
  )
}
