import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const colorVariants = ['neutral', 'primary', 'secondary', 'accent'] as const;

export default async function DividerTestPage(c: Context) {
  return (
    <div class="container mx-auto p-6 space-y-8">
      <a href="/test" class="inline-block text-sm text-base-content/50 hover:text-base-content/80 mb-4">&larr; 返回測試頁</a>
      <section>
        <h1 class="text-3xl font-bold mb-2">分隔線方塊測試</h1>
        <p class="text-base-content/70">使用 &lt;Cube from="方塊:方塊:分隔線" /&gt;</p>
      </section>

      {/* ── 純線條：方向 × 顏色 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">純線條（方向 × 顏色）</h2>
        <div class="space-y-6">
          {(['horizontal', 'vertical'] as const).map(dir => (
            <div>
              <h3 class="text-lg font-medium mb-3 capitalize">{dir}</h3>
              <div class={dir === 'vertical' ? 'flex gap-4 h-32' : 'space-y-3'}>
                {colorVariants.map(color => (
                  <div class="flex flex-col items-center gap-1">
                    <Cube from="方塊:方塊:分隔線" context={c} direction={dir} color={color} />
                    <span class="text-xs text-base-content/50">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 含文字標籤 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">含文字標籤</h2>
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium mb-3">水平</h3>
            <div class="w-full max-w-md space-y-4">
              {colorVariants.map(color => (
                <div class="flex flex-col items-center gap-1">
                  <Cube from="方塊:方塊:分隔線" context={c} direction="horizontal" color={color} label="OR" />
                  <span class="text-xs text-base-content/50">{color}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 class="text-lg font-medium mb-3">垂直</h3>
            <div class="flex gap-8 h-32">
              {colorVariants.map(color => (
                <div class="flex flex-col items-center gap-1">
                  <Cube from="方塊:方塊:分隔線" context={c} direction="vertical" color={color} label="OR" />
                  <span class="text-xs text-base-content/50">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 在容器內使用 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">在容器內使用</h2>
        <div class="flex flex-wrap gap-6">
          {colorVariants.map(color => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-lg w-64">
              <span class="text-sm font-medium">上方內容</span>
              <Cube from="方塊:方塊:分隔線" context={c} direction="horizontal" color={color} />
              <span class="text-sm font-medium">下方內容</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 使用說明 ── */}
      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>純線條</strong>：&lt;Cube from="方塊:方塊:分隔線" direction="horizontal" color="primary" /&gt;</li>
          <li><strong>含標籤</strong>：&lt;Cube from="方塊:方塊:分隔線" label="OR" /&gt;</li>
          <li><strong>垂直</strong>：direction="vertical"，父層需有高度（如 h-32）</li>
        </ul>
      </div>
    </div>
  );
}
