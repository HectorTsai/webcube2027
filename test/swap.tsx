import Swap, { SwapProps } from '../components/Swap.tsx';

const svgSet = {
  sun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
  moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3.868 19 12 5 20.132z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
  user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  phone: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
};

const animationVariants = [
  // 淡入淡出
  'fade-in',
  'fade-out',
  'fade-in-50',
  'fade-out-75',
  // 縮放
  'zoom-in',
  'zoom-out',
  'zoom-in-50',
  'zoom-out-80',
  // 旋轉
  'spin-in',
  'spin-out',
  'spin-in-90',
  'spin-out-180',
  'spin-in-x',
  'spin-out-x',
  'spin-in-y',
  'spin-out-y',
  // 滑動
  'slide-in-from-top',
  'slide-in-from-bottom',
  'slide-in-from-left',
  'slide-in-from-right',
  'slide-out-to-top',
  'slide-out-to-bottom',
  'slide-out-to-left',
  'slide-out-to-right',
  // 模糊
  'blur-in',
  'blur-out',
  // 傾斜
  'skew-in-x',
  'skew-in-y',
  'skew-out-x',
  'skew-out-y',
  // 縮放 X/Y 軸
  'scale-x-in',
  'scale-y-in',
  'scale-x-out',
  'scale-y-out'
];

export default function SwapTestPage() {
  const swapConfigs = [
    {
      title: "SVG 來源 + fade 互換",
      props: { fromSvg: svgSet.sun, toSvg: svgSet.moon, animateIn: "fade-in", animateOut: "fade-out" },
    },
    {
      title: "SVG 來源 + spin 互換",
      props: { fromSvg: svgSet.play, toSvg: svgSet.pause, animateIn: "spin-in", animateOut: "spin-out" },
    },
    {
      title: "Icon 切換",
      props: { fromSvg: svgSet.user, toSvg: svgSet.phone, animateIn: "slide-in-from-top", animateOut: "slide-out-to-bottom" },
    },
    {
      title: "圖片來源互換",
      props: { fromSrc: "https://placekitten.com/80/80", toSrc: "https://picsum.photos/80", animateIn: "zoom-in", animateOut: "zoom-out" },
    },
  ];

  const sizeVariants: SwapProps['size'][] = ['xs', 'sm', 'md', 'lg', 'xl'];

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Swap 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Swap 配置，點擊切換狀態</p>

        <div class="flex flex-wrap gap-6 mt-6">
          {swapConfigs.map((config) => (
              <div class="flex flex-col items-center gap-4 min-h-32 p-6 bg-base-200 rounded-lg">
                <h3 class="text-lg font-semibold text-center">{config.title}</h3>
                <div class="flex justify-center items-center">
                  {Swap({ size: 'lg', ...config.props })}
                </div>
                <p class="text-sm text-base-content/70 text-center">點擊上方元素切換狀態</p>
              </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化測試</h2>
        <div class="flex flex-wrap gap-6">
          {sizeVariants.map((variant) => (
            <div class="flex flex-col items-center gap-4 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-md font-medium">尺寸 {String(variant).toUpperCase()}</h3>
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                {Swap({ 
                  size: variant, 
                  fromSvg: svgSet.sun, 
                  toSvg: svgSet.moon, 
                  animateIn: "fade-in", 
                  animateOut: "fade-out" 
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">動畫效果測試</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {animationVariants.map((animation) => (
            <div class="flex flex-col items-center gap-3 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium text-center">{animation}</h3>
              <div class="flex justify-center items-center p-3 bg-base-200 rounded-lg">
                {Swap({ 
                  size: 'md', 
                  fromSvg: svgSet.sun, 
                  toSvg: svgSet.moon, 
                  animateIn: animation, 
                  animateOut: animation 
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">狀態測試</h2>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col items-center gap-4 p-4 bg-base-100 shadow-md rounded-lg">
            <h3 class="text-md font-medium">正常狀態</h3>
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Swap({ 
                size: 'md', 
                fromSvg: svgSet.sun, 
                toSvg: svgSet.moon 
              })}
            </div>
          </div>
          <div class="flex flex-col items-center gap-4 p-4 bg-base-100 shadow-md rounded-lg">
            <h3 class="text-md font-medium">禁用狀態</h3>
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Swap({ 
                size: 'md', 
                fromSvg: svgSet.sun, 
                toSvg: svgSet.moon, 
                disabled: true 
              })}
            </div>
          </div>
          <div class="flex flex-col items-center gap-4 p-4 bg-base-100 shadow-md rounded-lg">
            <h3 class="text-md font-medium">預設開啟</h3>
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Swap({ 
                size: 'md', 
                fromSvg: svgSet.sun, 
                toSvg: svgSet.moon, 
                defaultChecked: true 
              })}
            </div>
          </div>
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>fromSvg/toSvg</strong>: 直接使用 SVG 字串作為圖示</li>
          <li><strong>fromId/toId</strong>: 從資料庫載入圖示</li>
          <li><strong>fromSrc/toSrc</strong>: 使用圖片 URL</li>
          <li><strong>animateIn/animateOut</strong>: 過渡動畫效果</li>
          <li><strong>size</strong>: 圖示尺寸</li>
          <li><strong>disabled</strong>: 禁用狀態</li>
          <li><strong>defaultChecked</strong>: 預設選中狀態</li>
          <li><strong>label</strong>: 可存取性標籤</li>
        </ul>
      </div>
    </div>
  );
}
