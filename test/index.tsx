export default function TestIndex() {
  const testPages = [
    { name: "Swap 測試", path: "/test/swap" },
    { name: "Toggle 測試", path: "/test/toggle" },
    { name: "Avatar 測試", path: "/test/avatar" },
    { name: "Button 測試", path: "/test/button" },
    { name: "Container 測試", path: "/test/container" },
    { name: "HoverContainer 測試", path: "/test/hover-container" },
    { name: "Card 測試", path: "/test/card" },
    { name: "List 測試", path: "/test/list" },
    { name: "Divider 測試", path: "/test/divider" },
    { name: "Icon 測試", path: "/test/icon" },
    { name: "Image 測試", path: "/test/image" },
  ];

  return (
    <div class="container mx-auto p-8">
      <h1 class="text-3xl font-bold mb-8">測試頁面列表</h1>
      
      <ul class="space-y-4">
        {testPages.map(page => (
          <li>
            <a 
              href={page.path}
              class="text-blue-600 hover:text-blue-800 hover:underline text-lg"
            >
              {page.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
