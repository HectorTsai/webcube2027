export function Home() {
  return (
    <html lang="zh-Hant" class="bg-slate-950">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hono + UnoCSS Starter</title>
        <link rel="stylesheet" href="/uno.css" />
      </head>
      <body class="min-h-screen text-slate-100">
        <main class="mx-auto flex min-h-screen max-w-4xl flex-col gap-12 px-6 py-16">
          <section class="flex flex-col gap-6">
            <p class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Hono + UnoCSS
            </p>
            <h1 class="text-4xl font-bold leading-tight sm:text-5xl">
              極速 Deno 伺服器，搭配即時原子化樣式。
            </h1>
            <p class="text-lg text-slate-300">
              透過 Hono 的輕量路由與 UnoCSS 的按需原子化樣式，快速打造可部屬的
              Web 伺服器。修改 <code class="rounded bg-slate-800 px-2 py-1 font-mono text-sm">src/home.tsx</code> 即可開始。
            </p>
            <div class="flex flex-wrap gap-3">
              <a
                class="rounded-full bg-cyan-500 px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:translate-y-[-1px] hover:bg-cyan-400"
                href="https://hono.dev" target="_blank" rel="noreferrer"
              >
                查看 Hono 文件
              </a>
              <a
                class="rounded-full border border-slate-700 px-4 py-2 font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
                href="https://unocss.dev" target="_blank" rel="noreferrer"
              >
                查看 UnoCSS 文件
              </a>
            </div>
          </section>

          <section class="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl shadow-cyan-500/5">
            <h2 class="text-xl font-semibold">快速上手</h2>
            <ol class="list-decimal space-y-2 pl-6 text-slate-200">
              <li>執行 <code class="rounded bg-slate-800 px-2 py-1 font-mono text-sm">deno task uno</code> 生成 <code class="rounded bg-slate-800 px-2 py-1 font-mono text-sm">public/uno.css</code>。</li>
              <li>執行 <code class="rounded bg-slate-800 px-2 py-1 font-mono text-sm">deno task serve</code>，造訪 <code class="rounded bg-slate-800 px-2 py-1 font-mono text-sm">http://localhost:8000</code>。</li>
              <li>想要即時開發，可使用 <code class="rounded bg-slate-800 px-2 py-1 font-mono text-sm">deno task dev</code> 同步啟動 UnoCSS watch 與 Hono 伺服器。</li>
            </ol>
          </section>

          <footer class="border-t border-slate-800 pt-6 text-sm text-slate-500">
            由 Deno、Hono 與 UnoCSS 驅動。
          </footer>
        </main>
      </body>
    </html>
  )
}
