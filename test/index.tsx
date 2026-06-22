import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

export default async function TestIndex(c: Context) {
  const testPages = [
    { name: "圖示測試", path: "/test/圖示" },
    { name: "圖片測試", path: "/test/圖片" },
    { name: "容器測試", path: "/test/容器" },
    { name: "卡片測試", path: "/test/卡片" },
    { name: "抽屜測試", path: "/test/抽屜" },
    { name: "按鈕測試", path: "/test/按鈕" },
    { name: "超連結測試", path: "/test/超連結" },
    { name: "列表測試", path: "/test/列表" },
    { name: "頁尾測試", path: "/test/頁尾" },
    { name: "主選單測試", path: "/test/主選單" },
    { name: "基礎佈局測試", path: "/test/基礎佈局" },
  ];

  return (
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">測試頁面</h1>
      <div class="flex flex-wrap gap-3">
        {testPages.map(page => (
          <Cube
            from="方塊:方塊:超連結"
            context={c}
            color="base"
            size="md"
            href={page.path}
          >
            {page.name}
          </Cube>
        ))}
      </div>
    </div>
  );
}