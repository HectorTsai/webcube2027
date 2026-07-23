/**
 * ai-gateway 首頁儀表板
 */

import type { FC } from "hono/jsx";
import { Layout } from "./_layout.tsx";

const 首頁: FC = () => (
  <Layout title="AI 中心">
    <div class="min-h-screen bg-base-200">
      {/* ── Navbar ── */}
      <div class="navbar bg-base-100 shadow-sm px-4">
        <div class="flex-1">
          <a class="btn btn-ghost text-xl">AI 中心</a>
        </div>
        <div class="flex-none">
          <a href="/login" class="btn btn-primary btn-sm">登入</a>
        </div>
      </div>

      {/* ── Hero ── */}
      <main class="container mx-auto p-6">
        <div class="hero min-h-[50vh]">
          <div class="hero-content text-center">
            <div class="max-w-2xl">
              <h1 class="text-5xl font-bold">AI 中心</h1>
              <p class="py-4 text-base-content/60">
                AI 資源池管理 &mdash; 提供 OpenAI 相容 API
              </p>
              <div class="flex gap-3 justify-center mt-4">
                <a href="/api/health" class="btn btn-primary">API 健康狀態</a>
                <a href="/api/admin/servers" class="btn btn-ghost">AI 伺服器列表</a>
              </div>
            </div>
          </div>
        </div>

        {/* ── 特色卡片 ── */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200">
            <div class="card-body items-center text-center py-5 px-4 gap-2">
              <div class="text-3xl text-primary mb-1">&#9889;</div>
              <h3 class="font-semibold text-sm">OpenAI 相容 API</h3>
              <p class="text-xs text-base-content/50">
                提供 <code>/v1/chat/completions</code>、<code>/v1/embeddings</code>、<code>/v1/models</code>
              </p>
            </div>
          </div>
          <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200">
            <div class="card-body items-center text-center py-5 px-4 gap-2">
              <div class="text-3xl text-secondary mb-1">&#9699;</div>
              <h3 class="font-semibold text-sm">多供應商支援</h3>
              <p class="text-xs text-base-content/50">OpenAI、Anthropic、Gemini、Ollama 統一介面</p>
            </div>
          </div>
          <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200">
            <div class="card-body items-center text-center py-5 px-4 gap-2">
              <div class="text-3xl text-accent mb-1 font-mono font-light">A→B</div>
              <h3 class="font-semibold text-sm">AI 資源池</h3>
              <p class="text-xs text-base-content/50">動態路由、自動容錯、用量限制</p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer class="text-center text-base-content/25 text-xs py-4">
        WebCube2027 &mdash; AI Gateway
      </footer>
    </div>
  </Layout>
);

export default 首頁;