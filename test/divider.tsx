import { Divider } from '../components/Divider/index.tsx';
import Card from '../components/Card/index.tsx';

export default async function DividerTestPage() {
  const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error"] as const;
  const positions = ["start", "center", "end"] as const;

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Divider 組件測試</h1>
        <p class="text-base-content/70">展示 Divider 的各種配置</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">基本 Divider</h2>
        <div class="space-y-4">
          <div class="p-4 bg-base-200 rounded-box">Content 1</div>
          <Divider />
          <div class="p-4 bg-base-200 rounded-box">Content 2</div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">有文字的 Divider</h2>
        <div class="space-y-4">
          <div class="p-4 bg-base-200 rounded-box">Content 1</div>
          <Divider>OR</Divider>
          <div class="p-4 bg-base-200 rounded-box">Content 2</div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">Divider 各種 Colors</h2>
        <div class="space-y-4">
          {colors.map((color) => (
            <div key={color}>
              <Divider color={color}>{color}</Divider>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">Divider 各種 Positions</h2>
        <div class="space-y-4">
          {positions.map((position) => (
            <div key={position}>
              <Divider position={position}>{position}</Divider>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">水平 Divider</h2>
        <div class="flex flex-row h-48">
          <div class="flex-1 p-4 bg-base-200 rounded-box">Content 1</div>
          <Divider horizontal>OR</Divider>
          <div class="flex-1 p-4 bg-base-200 rounded-box">Content 2</div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">水平 Divider 各種 Positions</h2>
        <div class="space-y-4">
          {positions.map((position) => (
            <div key={position} class="flex flex-row h-32">
              <div class="flex-1 p-4 bg-base-200 rounded-box">Content</div>
              <Divider horizontal position={position}>{position}</Divider>
              <div class="flex-1 p-4 bg-base-200 rounded-box">Content</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">在 Card 中使用</h2>
        <Card variant="solid" color="primary">
          <h3 class="text-xl font-bold mb-4">Card Title</h3>
          <p>Card content goes here</p>
          <Divider>Section</Divider>
          <p>More content here</p>
        </Card>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>Divider</strong>: 分隔線組件，用於垂直或水平分隔內容</li>
          <li><strong>children</strong>: 分隔線中間的文字（可選）</li>
          <li><strong>horizontal</strong>: 是否為水平分隔線（預設 false，垂直）</li>
          <li><strong>color</strong>: 分隔線和文字的顏色（primary, secondary, accent, info, success, warning, error）</li>
          <li><strong>position</strong>: 文字位置（start, center, end）</li>
          <li>支援任意屬性（包括 Alpine.js x- 屬性和事件處理器）</li>
        </ul>
      </div>
    </div>
  );
}
