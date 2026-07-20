// 首頁
import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";

const 首頁: FC = () => (
  <Layout title="AI 中心" theme="light">
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg">
        <div class="flex-1">
          <a class="btn btn-ghost text-xl">AI 中心</a>
        </div>
        <div class="flex-none gap-2">
          <a href="/login" class="btn btn-primary">登入</a>
        </div>
      </div>

      <main class="container mx-auto p-6">
        <div class="hero min-h-[60vh]">
          <div class="hero-content text-center">
            <div class="max-w-2xl">
              <h1 class="text-5xl font-bold">AI 中心</h1>
              <p class="py-6 text-lg">Deno + Hono + TailwindCSS + DaisyUI + AI Pool</p>
              <a href="/api/health" class="btn btn-primary">API 健康檢查</a>
              <a href="/api/v1/ai/servers" class="btn btn-ghost">AI Server 列表</a>
            </div>
          </div>
        </div>
      </main>

      <footer class="footer footer-center bg-base-300 text-base-content p-6">
        <p>Powered by Deno & Hono</p>
      </footer>
    </div>
  </Layout>
);

export default 首頁;
