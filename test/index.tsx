import { Context } from 'hono';

export default function TestIndex(_ctx: Context) {
  const testPages = [
    { name: "Icon 測試", path: "/test/圖示" },
    { name: "Image 測試", path: "/test/圖片" },
    { name: "Container 測試", path: "/test/容器" },
    { name: "卡片測試", path: "/test/卡片" },
    { name: "抽屜測試", path: "/test/抽屜" },
  ];

  return (
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">測試頁面</h1>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {testPages.map(page => (
          <a
            key={page.path}
            href={page.path}
            class="block px-4 py-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors text-center"
          >
            {page.name}
          </a>
        ))}
      </div>
    </div>
  );
}