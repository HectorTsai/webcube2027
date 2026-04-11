import { List, ListRow, ListTitle } from '../components/List/index.tsx';
import { Divider } from '../components/Divider/index.tsx';
import Avatar from '../components/Avatar/index.tsx';
import Button from '../components/Button/index.tsx';
import Icon from '../components/Icon.tsx';

export default async function ListTestPage() {
  const playIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor"><path d="M6 3L20 12 6 21 6 3z"></path></g></svg>';
  const heartIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></g></svg>';
  
  const songs = [
    { name: "Dio Lupa", artist: "Remaining Reason", image: "影像:影像:hono" },
    { name: "Ellie Beilish", artist: "Bears of a fever", image: "影像:影像:surrealDB" },
    { name: "Sabrino Gardener", artist: "Cappuccino", image: "影像:影像:deno2" },
  ];
  
  const items = [
    { icon: "圖示:圖示:user", title: "John Doe", subtitle: "john@example.com" },
    { icon: "圖示:圖示:user", title: "Jane Smith", subtitle: "jane@example.com" },
    { icon: "圖示:圖示:user", title: "Bob Johnson", subtitle: "bob@example.com" },
  ];

  const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error"] as const;
  const variants = ["solid", "outline", "ghost", "dot", "dashed", "double", 
                   "glow", "crystal", "diagonal-stripes", "minimalist"] as const;

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">List 組件測試</h1>
        <p class="text-base-content/70">展示 List 的各種配置（使用 Container 包裹，支援所有 variants & colors！）</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">基本 List</h2>
        <List>
          <ListTitle>Most played songs this week</ListTitle>
          <ListRow>
            <Avatar size="md" variant="solid" color="primary" image={songs[0].image} />
            <div class="flex-1">
              <div class="font-medium">{songs[0].name}</div>
              <div class="text-xs uppercase font-semibold opacity-60">{songs[0].artist}</div>
            </div>
            <Button variant="ghost" color="secondary" size="sm"><Icon svg={playIcon} /></Button>
            <Button variant="ghost" color="warning" size="sm"><Icon svg={heartIcon} /></Button>
          </ListRow>
          <ListRow>
            <Avatar size="md" variant="solid" color="secondary" image={songs[1].image} />
            <div class="flex-1">
              <div class="font-medium">{songs[1].name}</div>
              <div class="text-xs uppercase font-semibold opacity-60">{songs[1].artist}</div>
            </div>
            <Button variant="ghost" size="sm"><Icon svg={playIcon} /></Button>
            <Button variant="ghost" size="sm"><Icon svg={heartIcon} /></Button>
          </ListRow>
          <ListRow>
            <Avatar size="md" variant="solid" color="accent" image={songs[2].image} />
            <div class="flex-1">
              <div class="font-medium">{songs[2].name}</div>
              <div class="text-xs uppercase font-semibold opacity-60">{songs[2].artist}</div>
            </div>
            <Button variant="ghost" size="sm"><Icon svg={playIcon} /></Button>
            <Button variant="ghost" size="sm"><Icon svg={heartIcon} /></Button>
          </ListRow>
        </List>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">List 各種 Colors</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {colors.map((color) => (
            <List variant="solid" color={color} divider key={color}>
              <ListTitle>{color}</ListTitle>
              <ListRow><Icon svg={playIcon} />項目 1</ListRow>
              <ListRow><Icon svg={playIcon} />項目 2</ListRow>
              <ListRow><Icon svg={playIcon} />項目 3</ListRow>
            </List>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">List 各種 Variants</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {variants.map((variant) => (
            <List variant={variant} color="primary" divider key={variant}>
              <ListTitle>{variant}</ListTitle>
              <ListRow>項目 1</ListRow>
              <ListRow>項目 2</ListRow>
              <ListRow>項目 3</ListRow>
            </List>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">有分隔線的 List</h2>
        <List variant="outline" color="secondary">
          <ListTitle>聯絡人</ListTitle>
          {items.map((item, i) => (
            <div key={i}>
              <ListRow>
                <Icon id={item.icon} size="lg" className="text-primary" />
                <div class="flex-1">
                  <div class="font-medium">{item.title}</div>
                  <div class="text-sm opacity-60">{item.subtitle}</div>
                </div>
                <Button variant="ghost" size="sm">查看</Button>
              </ListRow>
              {i < items.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">緊湊的 List</h2>
        <List variant="solid" color="secondary" compact divider>
          <ListTitle className="!p-2 !pb-1">快速清單</ListTitle>
          <ListRow className="!p-2">
            <Icon id="圖示:圖示:phone" size="sm" className="text-success" />
            <span>完成的事項</span>
          </ListRow>
          <ListRow className="!p-2">
            <Icon id="圖示:圖示:phone" size="sm" className="text-success" />
            <span>另一個完成的事項</span>
          </ListRow>
          <ListRow className="!p-2">
            <Icon id="圖示:圖示:phone" size="sm" className="text-warning" />
            <span>待處理的事項</span>
          </ListRow>
        </List>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>List</strong>: 主要的列表容器（使用 Container 包裹）</li>
          <li><strong>ListRow</strong>: 列表項目，使用在 List 內部</li>
          <li><strong>variant</strong>: 樣式變體（支援所有 20 個 variants！）</li>
          <li><strong>color</strong>: 顏色主題（支援所有 7 個 colors！）</li>
          <li><strong>divider</strong>: 顯示分隔線</li>
          <li><strong>compact</strong>: 緊湊模式</li>
          <li>使用 <strong>flex-1</strong> 讓中間的內容自動填滿剩餘空間</li>
          <li>ListRow 有預設的 hover 效果（hover:bg-gray-100/30）</li>
          <li>支援任意屬性（包括 Alpine.js x- 屬性和事件處理器）</li>
        </ul>
      </div>
    </div>
  );
}
