import { jsx } from "hono/jsx";

export default async function TestPage() {
  // 測試載入 Button index
  try {
    const ButtonModule = await import("./components/Button/index.tsx");
    const Button = ButtonModule.default;
    
    // 渲染所有 Button variant
    const buttons = [
      await Button({ color: "primary", children: "Solid" }),
      await Button({ color: "secondary", variant: "outline", children: "Outline" }),
      await Button({ color: "accent", variant: "ghost", children: "Ghost" }),
      await Button({ color: "info", variant: "dot", children: "Dot" }),
      await Button({ color: "success", variant: "dashed", children: "Dashed" }),
      await Button({ color: "warning", variant: "double", children: "Double" }),
      await Button({ color: "error", variant: "gradient-right", children: "Gradient Right" }),
      await Button({ color: "primary", variant: "gradient-left", children: "Gradient Left" }),
      await Button({ color: "secondary", variant: "gradient-left", children: "Gradient Left (Secondary)" }),
      await Button({ color: "success", variant: "gradient-left", children: "Gradient Left (Success)" }),
      await Button({ color: "secondary", variant: "gradient-up", children: "Gradient Up" }),
      await Button({ color: "accent", variant: "gradient-down", children: "Gradient Down" }),
      await Button({ color: "info", variant: "gradient-diagonal", children: "Gradient Diagonal" }),
      await Button({ color: "success", variant: "gradient-circle", children: "Gradient Circle" }),
      await Button({ color: "warning", variant: "gradient-cone", children: "Gradient Cone" }),
      await Button({ color: "error", variant: "glow", children: "Glow" }),
    ];
    
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-3xl font-bold mb-8" }, "所有 Button Variant 測試"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, buttons),
      
      // 測試 UnoCSS gradient 類別
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "UnoCSS Gradient 測試"),
      jsx('div', { class: "space-y-4" }, [
        jsx('div', { class: "btn bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2" }, "bg-gradient-to-r from-primary to-primary/80"),
        jsx('div', { class: "btn bg-gradient-to-l from-secondary to-secondary/80 text-white px-4 py-2" }, "bg-gradient-to-l from-secondary to-secondary/80"),
        jsx('div', { class: "btn bg-gradient-to-t from-accent to-accent/80 text-white px-4 py-2" }, "bg-gradient-to-t from-accent to-accent/80"),
        // 測試 gradient-left 相同的 classes
        jsx('div', { class: "btn bg-gradient-to-r from-primary/10 to-primary/90 text-white px-4 py-2" }, "測試: bg-gradient-to-r from-primary/10 to-primary/90")
      ]),
      
      // 測試普通背景色透明度
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "背景色透明度測試"),
      jsx('div', { class: "space-y-4" }, [
        jsx('div', { class: "bg-primary p-8 rounded-lg" }, [
          jsx('div', { class: "bg-info/50 p-4 rounded text-white" }, "這是 bg-info/50 在 bg-primary 上")
        ]),
        jsx('div', { class: "bg-secondary p-8 rounded-lg" }, [
          jsx('div', { class: "bg-warning/30 p-4 rounded text-white" }, "這是 bg-warning/30 在 bg-secondary 上")
        ]),
        // 測試相同的 oklch 顏色
        jsx('div', { class: "p-4 rounded text-white", style: "background: oklch(59.67% 0.221 258.03 / 0.1)" }, "直接 oklch(59.67% 0.221 258.03 / 0.1)"),
        jsx('div', { class: "p-4 rounded text-white", style: "background: oklch(59.67% 0.221 258.03 / 0.9)" }, "直接 oklch(59.67% 0.221 258.03 / 0.9)")
      ])
    ]);
  } catch (error) {
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-2xl font-bold mb-4" }, "載入失敗"),
      jsx('pre', {}, String(error))
    ]);
  }
}
