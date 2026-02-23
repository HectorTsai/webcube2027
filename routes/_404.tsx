export default function NotFound() {
  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-100">
      <div class="text-center">
        <h1 class="mb-4 text-6xl font-bold text-gray-800">404</h1>
        <h2 class="mb-4 text-2xl font-semibold text-gray-600">頁面未找到</h2>
        <p class="mb-8 text-gray-500">抱歉，您請求的頁面不存在。</p>
        <a
          href="/"
          class="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
        >
          返回首頁
        </a>
      </div>
    </div>
  );
}
