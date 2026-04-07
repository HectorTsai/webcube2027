import { jsx } from "hono/jsx";

export default function TestIndex() {
  const testPages = [
    { name: "Avatar 測試", path: "/test/avatar" },
    { name: "Button 測試", path: "/test/button" },
    { name: "Container 測試", path: "/test/container" },
    { name: "Icon 測試", path: "/test/icon" },
    { name: "Image 測試", path: "/test/image" },
  ];

  return jsx('div', { class: "p-8" }, [
    jsx('h1', { class: "text-3xl font-bold mb-8" }, "測試頁面列表"),
    
    jsx('ul', { class: "space-y-4" }, ...testPages.map(page => 
      jsx('li', {}, [
        jsx('a', { 
          href: page.path,
          class: "text-blue-600 hover:text-blue-800 hover:underline text-lg"
        }, page.name as any)
      ] as any)
    ) as any),
  ]);
}
