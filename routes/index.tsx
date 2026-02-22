/**
 * Home page
 * Route: /
 */

import 按鈕 from "../components/實心/按鈕.tsx";

import { createSignal } from "@dreamer/view";

export default function Home() {
  const [count, setCount] = createSignal(0);
  return (
    <div class="p-5 bg-blue-500 text-white">
      <section class="mb-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 p-5 text-center text-white">
        <h1 class="mb-4 text-4xl">Welcome to Dweb</h1>
        <p class="text-xl text-white/90">
          A View sample project built with @dreamer/dweb
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-wide bg-clip-text text-transparent bg-linear-to-r from-[#667eea] to-[#764ba2]">
          Features
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="rounded-lg bg-white p-6 shadow-md"
            style={{ color: "#667eea", fontWeight: "bold" }}
          >
            <h3 className="mb-2.5">File routing</h3>
            <p>File-based routing, no manual config</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-2.5" style={{ color: "#667eea" }}>
              SSR
            </h3>
            <p>Server-side rendering for best first-screen performance</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-2.5" style={{ color: "#667eea" }}>
              TypeScript
            </h3>
            <p>Full TypeScript support</p>
          </div>
          <div
            class="rounded-lg bg-white p-6 shadow-md"
            text="[#667eea]"
            font="bold"
          >
            <h3 class="mb-2.5 flex items-center gap-2">
              <i class="i-carbon-home"></i>
              <i class="i-mdi-light-home"></i>
              <i class="i-heroicons-home"></i>
              View
            </h3>
            <p>Lightweight React alternative</p>
          </div>
        </div>
      </section>

      <section class="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
        <h2 class="mb-4 text-center text-[#667eea]">Counter example</h2>
        <p class="mb-4 text-center text-sm text-gray-500">
          View fine-grained update: only this block updates with count
        </p>
        {() => (
          <div class="flex flex-col items-center justify-center gap-4">
            <span class="text-2xl font-semibold">count: {count()}</span>
            <div class="flex flex-wrap items-center justify-center gap-2">
              <按鈕 顏色="資訊" onClick={() => setCount(count() + 1)}>
                Test
              </按鈕>
              <按鈕 顏色="主要" onClick={() => setCount(count() + 1)}>
                Increment
              </按鈕>
              <按鈕 顏色="次要" onClick={() => setCount(count() - 1)}>
                Decrement
              </按鈕>
              <按鈕 顏色="隱藏" onClick={() => setCount(0)}>
                Reset
              </按鈕>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
