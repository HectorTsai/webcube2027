import Toggle, { ToggleProps } from '../components/Toggle.tsx';

const svgSet = {
  sun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
  moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  play: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  power: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
  wifi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  wifiOff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  bell: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  bellOff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
};

export default async function ToggleTestPage() {
  const toggleConfigs = [
    {
      title: "純 Toggle (無圖示)",
      props: {},
    },
    {
      title: "日夜切換 (Unchecked)",
      props: { offSvg: svgSet.sun, onSvg: svgSet.moon, defaultChecked: false },
    },
    {
      title: "日夜切換 (Checked)",
      props: { offSvg: svgSet.sun, onSvg: svgSet.moon, defaultChecked: true },
    },
    {
      title: "播放/暫停",
      props: { offSvg: svgSet.play, onSvg: svgSet.pause },
    },
    {
      title: "WiFi 開關",
      props: { offSvg: svgSet.wifiOff, onSvg: svgSet.wifi },
    },
    {
      title: "通知鈴聲",
      props: { offSvg: svgSet.bellOff, onSvg: svgSet.bell },
    },
    {
      title: "單邊 Icon（僅開啟）",
      props: { onSvg: svgSet.wifi },
    },
    {
      title: "單邊 Icon（僅關閉）",
      props: { offSvg: svgSet.bellOff },
    },
    {
      title: "禁用狀態",
      props: { offSvg: svgSet.power, onSvg: svgSet.power, disabled: true },
    },
  ];

  const sizeVariants: ToggleProps['size'][] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const colorVariants: ToggleProps['color'][] = ['primary','secondary','accent','info','success','warning','error'];
  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Toggle 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Toggle 配置，點擊切換狀態</p>

        <div class="flex flex-wrap gap-6 mt-6">
          {toggleConfigs.map((config) => (
              <div class="flex justify-center items-center min-h-24 p-4 bg-base-200 rounded-lg">
                {Toggle({ size: 'lg', label: config.title, ...config.props })}
              </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化測試</h2>
        <div class="flex flex-wrap gap-6">
          {sizeVariants.map((variant) => (
            <div class="card bg-base-100 shadow-md p-4 flex flex-col items-center gap-4">
              <div class="flex justify-center items-center min-h-24 p-4 bg-base-200 rounded-lg">
                {Toggle({ size: variant, label: `尺寸 ${String(variant).toUpperCase()}` })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">色彩變化測試</h2>
        <div class="flex flex-wrap gap-6">
          {colorVariants.map((variant) => (
            <div class="card bg-base-100 shadow-md p-4 flex flex-col items-center gap-4">
              <div class="flex justify-center items-center min-h-24 p-4 bg-base-200 rounded-lg">
                {Toggle({
                  size: 'md',
                  color: variant as ToggleProps['color'],
                  label: `顏色 ${String(variant).toUpperCase()}`,
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section>
        <h2 class="text-2xl font-semibold mb-4">Label 布局測試</h2>
        <p class="text-base-content/70 mb-4">測試 label 在寬度不足時的換行效果</p>
        
        <div class="space-y-6">
          <div class="card bg-base-100 shadow-md p-4">
            <h3 class="text-lg font-semibold mb-2">正常寬度 - label 在右邊</h3>
            <div class="flex justify-center items-center min-h-24 p-4 bg-base-200 rounded-lg">
              {Toggle({ size: 'md', label: '正常標籤文字' })}
            </div>
            <p class="text-sm text-base-content/70 mt-2">正常寬度時，label 顯示在 toggle 右邊</p>
          </div>
          
          <div class="card bg-base-100 shadow-md p-4">
            <h3 class="text-lg font-semibold mb-2">中等寬度 - 長文字測試</h3>
            <div class="w-64 flex justify-center items-center min-h-24 p-4 bg-base-200 rounded-lg">
              {Toggle({ size: 'md', label: '這是一個中等長度的標籤文字，測試換行效果' })}
            </div>
            <p class="text-sm text-base-content/70 mt-2">寬度 64 (w-64)，label 可能換行</p>
          </div>
          
          <div class="card bg-base-100 shadow-md p-4">
            <h3 class="text-lg font-semibold mb-2">窄容器測試</h3>
            <div class="w-48 flex justify-center items-center min-h-24 p-4 bg-base-200 rounded-lg">
              {Toggle({ size: 'md', label: '這是一個非常長的標籤文字，當容器寬度不足時會自動換行到下方' })}
            </div>
            <p class="text-sm text-base-content/70 mt-2">寬度 48 (w-48)，label 會換行到下方</p>
          </div>
          
          <div class="card bg-base-100 shadow-md p-4">
            <h3 class="text-lg font-semibold mb-2">極窄容器測試</h3>
            <div class="w-32 flex justify-center items-center min-h-24 p-4 bg-base-200 rounded-lg">
              {Toggle({ size: 'md', label: '超長標籤文字測試，驗證換行效果' })}
            </div>
            <p class="text-sm text-base-content/70 mt-2">寬度 32 (w-32)，label 一定會換行到下方</p>
          </div>
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <p class="text-sm text-base-content/80 mb-2">下方各種組合展示無圖示、單邊圖示與提供 on/off 圖示的情形皆可運作。</p>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>offSvg/onSvg</strong>: 直接使用 SVG 字串作為圖示</li>
          <li><strong>offId/onId</strong>: 從資料庫載入圖示</li>
          <li><strong>offSrc/onSrc</strong>: 使用圖片 URL</li>
          <li>只設定 <strong>on</strong> 或 <strong>off</strong> 一側時，也會正確顯示單邊圖示</li>
          <li><strong>defaultChecked</strong>: 預設選中狀態</li>
          <li><strong>disabled</strong>: 禁用狀態</li>
          <li>圓角使用 <code>rounded-sm</code></li>
          <li><strong>Label 布局</strong>: 當容器寬度不足時，label 文字會自動換行到 toggle 下方</li>
        </ul>
      </div>
    </div>
  );
}
