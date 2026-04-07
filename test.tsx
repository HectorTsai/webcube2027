import { jsx } from "hono/jsx";

export default async function TestPage() {
  // 測試載入 Button index
  try {
    const ButtonModule = await import("./components/Button/index.tsx");
    const Button = ButtonModule.default;
    
    // 渲染所有 Button variant
    const solidButtons = [
      await Button({ color: "primary", variant: "solid", children: "Primary" }),
      await Button({ color: "secondary", variant: "solid", children: "Secondary" }),
      await Button({ color: "accent", variant: "solid", children: "Accent" }),
      await Button({ color: "neutral", variant: "solid", children: "Neutral" }),
      await Button({ color: "info", variant: "solid", children: "Info" }),
      await Button({ color: "success", variant: "solid", children: "Success" }),
      await Button({ color: "warning", variant: "solid", children: "Warning" }),
      await Button({ color: "error", variant: "solid", children: "Error" }),
    ];
    
    const outlineButtons = [
      await Button({ color: "primary", variant: "outline", children: "Primary" }),
      await Button({ color: "secondary", variant: "outline", children: "Secondary" }),
      await Button({ color: "accent", variant: "outline", children: "Accent" }),
      await Button({ color: "neutral", variant: "outline", children: "Neutral" }),
      await Button({ color: "info", variant: "outline", children: "Info" }),
      await Button({ color: "success", variant: "outline", children: "Success" }),
      await Button({ color: "warning", variant: "outline", children: "Warning" }),
      await Button({ color: "error", variant: "outline", children: "Error" }),
    ];
    
    const ghostButtons = [
      await Button({ color: "primary", variant: "ghost", children: "Primary" }),
      await Button({ color: "secondary", variant: "ghost", children: "Secondary" }),
      await Button({ color: "accent", variant: "ghost", children: "Accent" }),
      await Button({ color: "neutral", variant: "ghost", children: "Neutral" }),
      await Button({ color: "info", variant: "ghost", children: "Info" }),
      await Button({ color: "success", variant: "ghost", children: "Success" }),
      await Button({ color: "warning", variant: "ghost", children: "Warning" }),
      await Button({ color: "error", variant: "ghost", children: "Error" }),
    ];
    
    const dotButtons = [
      await Button({ color: "primary", variant: "dot", children: "Primary" }),
      await Button({ color: "secondary", variant: "dot", children: "Secondary" }),
      await Button({ color: "accent", variant: "dot", children: "Accent" }),
      await Button({ color: "neutral", variant: "dot", children: "Neutral" }),
      await Button({ color: "info", variant: "dot", children: "Info" }),
      await Button({ color: "success", variant: "dot", children: "Success" }),
      await Button({ color: "warning", variant: "dot", children: "Warning" }),
      await Button({ color: "error", variant: "dot", children: "Error" }),
    ];
    
    const gradientRightButtons = [
      await Button({ color: "primary", variant: "gradient-right", children: "Primary" }),
      await Button({ color: "secondary", variant: "gradient-right", children: "Secondary" }),
      await Button({ color: "accent", variant: "gradient-right", children: "Accent" }),
      await Button({ color: "info", variant: "gradient-right", children: "Info" }),
      await Button({ color: "success", variant: "gradient-right", children: "Success" }),
      await Button({ color: "warning", variant: "gradient-right", children: "Warning" }),
      await Button({ color: "error", variant: "gradient-right", children: "Error" }),
    ];
    
    const gradientLeftButtons = [
      await Button({ color: "primary", variant: "gradient-left", children: "Primary" }),
      await Button({ color: "secondary", variant: "gradient-left", children: "Secondary" }),
      await Button({ color: "accent", variant: "gradient-left", children: "Accent" }),
      await Button({ color: "info", variant: "gradient-left", children: "Info" }),
      await Button({ color: "success", variant: "gradient-left", children: "Success" }),
      await Button({ color: "warning", variant: "gradient-left", children: "Warning" }),
      await Button({ color: "error", variant: "gradient-left", children: "Error" }),
    ];
    
    const gradientUpButtons = [
      await Button({ color: "primary", variant: "gradient-up", children: "Primary" }),
      await Button({ color: "secondary", variant: "gradient-up", children: "Secondary" }),
      await Button({ color: "accent", variant: "gradient-up", children: "Accent" }),
      await Button({ color: "info", variant: "gradient-up", children: "Info" }),
      await Button({ color: "success", variant: "gradient-up", children: "Success" }),
      await Button({ color: "warning", variant: "gradient-up", children: "Warning" }),
      await Button({ color: "error", variant: "gradient-up", children: "Error" }),
    ];
    
    const gradientDownButtons = [
      await Button({ color: "primary", variant: "gradient-down", children: "Primary" }),
      await Button({ color: "secondary", variant: "gradient-down", children: "Secondary" }),
      await Button({ color: "accent", variant: "gradient-down", children: "Accent" }),
      await Button({ color: "info", variant: "gradient-down", children: "Info" }),
      await Button({ color: "success", variant: "gradient-down", children: "Success" }),
      await Button({ color: "warning", variant: "gradient-down", children: "Warning" }),
      await Button({ color: "error", variant: "gradient-down", children: "Error" }),
    ];
    
    const gradientCenterButtons = [
      await Button({ color: "primary", variant: "gradient-center", children: "Primary" }),
      await Button({ color: "secondary", variant: "gradient-center", children: "Secondary" }),
      await Button({ color: "accent", variant: "gradient-center", children: "Accent" }),
      await Button({ color: "info", variant: "gradient-center", children: "Info" }),
      await Button({ color: "success", variant: "gradient-center", children: "Success" }),
      await Button({ color: "warning", variant: "gradient-center", children: "Warning" }),
      await Button({ color: "error", variant: "gradient-center", children: "Error" }),
    ];
    
    const gradientMiddleButtons = [
      await Button({ color: "primary", variant: "gradient-middle", children: "Primary" }),
      await Button({ color: "secondary", variant: "gradient-middle", children: "Secondary" }),
      await Button({ color: "accent", variant: "gradient-middle", children: "Accent" }),
      await Button({ color: "info", variant: "gradient-middle", children: "Info" }),
      await Button({ color: "success", variant: "gradient-middle", children: "Success" }),
      await Button({ color: "warning", variant: "gradient-middle", children: "Warning" }),
      await Button({ color: "error", variant: "gradient-middle", children: "Error" }),
    ];
    
    const crystalButtons = [
      await Button({ color: "primary", variant: "crystal", children: "Primary" }),
      await Button({ color: "secondary", variant: "crystal", children: "Secondary" }),
      await Button({ color: "accent", variant: "crystal", children: "Accent" }),
      await Button({ color: "info", variant: "crystal", children: "Info" }),
      await Button({ color: "success", variant: "crystal", children: "Success" }),
      await Button({ color: "warning", variant: "crystal", children: "Warning" }),
      await Button({ color: "error", variant: "crystal", children: "Error" }),
    ];
    
    const gradientConeButtons = [
      await Button({ color: "primary", variant: "gradient-cone", children: "Primary" }),
      await Button({ color: "secondary", variant: "gradient-cone", children: "Secondary" }),
      await Button({ color: "accent", variant: "gradient-cone", children: "Accent" }),
      await Button({ color: "info", variant: "gradient-cone", children: "Info" }),
      await Button({ color: "success", variant: "gradient-cone", children: "Success" }),
      await Button({ color: "warning", variant: "gradient-cone", children: "Warning" }),
      await Button({ color: "error", variant: "gradient-cone", children: "Error" }),
    ];
    
    const gradientDiagonalButtons = [
      await Button({ color: "primary", variant: "gradient-diagonal", children: "Primary" }),
      await Button({ color: "secondary", variant: "gradient-diagonal", children: "Secondary" }),
      await Button({ color: "accent", variant: "gradient-diagonal", children: "Accent" }),
      await Button({ color: "info", variant: "gradient-diagonal", children: "Info" }),
      await Button({ color: "success", variant: "gradient-diagonal", children: "Success" }),
      await Button({ color: "warning", variant: "gradient-diagonal", children: "Warning" }),
      await Button({ color: "error", variant: "gradient-diagonal", children: "Error" }),
    ];
    
    const diagonalStripesButtons = [
      await Button({ color: "primary", variant: "diagonal-stripes", children: "Primary" }),
      await Button({ color: "secondary", variant: "diagonal-stripes", children: "Secondary" }),
      await Button({ color: "accent", variant: "diagonal-stripes", children: "Accent" }),
      await Button({ color: "info", variant: "diagonal-stripes", children: "Info" }),
      await Button({ color: "success", variant: "diagonal-stripes", children: "Success" }),
      await Button({ color: "warning", variant: "diagonal-stripes", children: "Warning" }),
      await Button({ color: "error", variant: "diagonal-stripes", children: "Error" }),
    ];
    
    const minimalistButtons = [
      await Button({ color: "primary", variant: "minimalist", children: "Primary" }),
      await Button({ color: "secondary", variant: "minimalist", children: "Secondary" }),
      await Button({ color: "accent", variant: "minimalist", children: "Accent" }),
      await Button({ color: "info", variant: "minimalist", children: "Info" }),
      await Button({ color: "success", variant: "minimalist", children: "Success" }),
      await Button({ color: "warning", variant: "minimalist", children: "Warning" }),
      await Button({ color: "error", variant: "minimalist", children: "Error" }),
    ];
    
    const doubleButtons = [
      await Button({ color: "primary", variant: "double", children: "Primary" }),
      await Button({ color: "secondary", variant: "double", children: "Secondary" }),
      await Button({ color: "accent", variant: "double", children: "Accent" }),
      await Button({ color: "info", variant: "double", children: "Info" }),
      await Button({ color: "success", variant: "double", children: "Success" }),
      await Button({ color: "warning", variant: "double", children: "Warning" }),
      await Button({ color: "error", variant: "double", children: "Error" }),
    ];
    
    const dashedButtons = [
      await Button({ color: "primary", variant: "dashed", children: "Primary" }),
      await Button({ color: "secondary", variant: "dashed", children: "Secondary" }),
      await Button({ color: "accent", variant: "dashed", children: "Accent" }),
      await Button({ color: "info", variant: "dashed", children: "Info" }),
      await Button({ color: "success", variant: "dashed", children: "Success" }),
      await Button({ color: "warning", variant: "dashed", children: "Warning" }),
      await Button({ color: "error", variant: "dashed", children: "Error" }),
    ];
    
    const glowButtons = [
      await Button({ color: "primary", variant: "glow", children: "Primary" }),
      await Button({ color: "secondary", variant: "glow", children: "Secondary" }),
      await Button({ color: "accent", variant: "glow", children: "Accent" }),
      await Button({ color: "info", variant: "glow", children: "Info" }),
      await Button({ color: "success", variant: "glow", children: "Success" }),
      await Button({ color: "warning", variant: "glow", children: "Warning" }),
      await Button({ color: "error", variant: "glow", children: "Error" }),
    ];
    
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-3xl font-bold mb-8" }, "所有 Button Variant 測試"),
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Solid 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, solidButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Glow 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, glowButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Outline 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, outlineButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Dot 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, dotButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Dashed 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, dashedButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Double 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, doubleButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Ghost 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, ghostButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Left 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, gradientLeftButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradiet Center 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, gradientCenterButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Right 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, gradientRightButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Up 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, gradientUpButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Middle 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, gradientMiddleButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Crystal 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, crystalButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Down 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, gradientDownButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Cone 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, gradientConeButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Diagonal 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, gradientDiagonalButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Diagonal Stripes 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, diagonalStripesButtons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Minimalist 按鈕"),
      jsx('div', { class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, minimalistButtons),
      
    ]);
  } catch (error) {
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-2xl font-bold mb-4" }, "載入失敗"),
      jsx('pre', {}, String(error))
    ]);
  }
}
