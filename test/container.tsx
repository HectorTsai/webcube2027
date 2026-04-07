import { jsx } from "hono/jsx";

export default async function TestPage() {
  // 測試載入 Container index
  try {
    const ContainerModule = await import("../components/Container/index.tsx");
    const Container = ContainerModule.default;
    
    // 渲染所有 Container variant
    const solidContainers = [
      await Container({ variant: "solid", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Solid Container 1"),
        jsx('div', {}, "Solid Container 2"),
      ]}),
      await Container({ color: "secondary", variant: "solid", direction: "row", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Row 1"),
        jsx('div', {}, "Row 2"),
      ]}),
    ];
    
    const outlineContainers = [
      await Container({ color: "info", variant: "outline", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Outline Container 1"),
        jsx('div', {}, "Outline Container 2"),
      ]}),
      await Container({ color: "accent", variant: "outline", direction: "row", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Row 1"),
        jsx('div', {}, "Row 2"),
      ]}),
    ];
    
    const ghostContainers = [
      await Container({ color: "success", variant: "ghost", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Ghost Container 1"),
        jsx('div', {}, "Ghost Container 2"),
      ]}),
      await Container({ color: "error", variant: "ghost", direction: "row", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Row 1"),
        jsx('div', {}, "Row 2"),
      ]}),
    ];
    
    const dotContainers = [
      await Container({ color: "warning", variant: "dot", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Dot Container 1"),
        jsx('div', {}, "Dot Container 2"),
      ]}),
      await Container({ color: "error", variant: "dot", direction: "row", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Row 1"),
        jsx('div', {}, "Row 2"),
      ]}),
    ];
    
    const dashedContainers = [
      await Container({ color: "success", variant: "dashed", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Dashed Container 1"),
        jsx('div', {}, "Dashed Container 2"),
      ]}),
      await Container({ color: "info", variant: "dashed", direction: "row", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Row 1"),
        jsx('div', {}, "Row 2"),
      ]}),
    ];
    
    const doubleContainers = [
      await Container({ color: "success", variant: "double", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Double Container 1"),
        jsx('div', {}, "Double Container 2"),
      ]}),
      await Container({ color: "secondary", variant: "double", direction: "row", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Row 1"),
        jsx('div', {}, "Row 2"),
      ]}),
    ];
    
    const gradientRightContainers = [
      await Container({ variant: "gradient-right", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Gradient Right 1"),
        jsx('div', {}, "Gradient Right 2"),
      ]}),
    ];
    
    const gradientLeftContainers = [
      await Container({ variant: "gradient-left", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Gradient Left 1"),
        jsx('div', {}, "Gradient Left 2"),
      ]}),
    ];
    
    const gradientUpContainers = [
      await Container({ variant: "gradient-up", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Gradient Up 1"),
        jsx('div', {}, "Gradient Up 2"),
      ]}),
    ];
    
    const gradientDownContainers = [
      await Container({ variant: "gradient-down", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Gradient Down 1"),
        jsx('div', {}, "Gradient Down 2"),
      ]}),
    ];
    
    const gradientMiddleContainers = [
      await Container({ variant: "gradient-middle", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Gradient Middle 1"),
        jsx('div', {}, "Gradient Middle 2"),
      ]}),
    ];
    
    const gradientDiagonalContainers = [
      await Container({ variant: "gradient-diagonal", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Gradient Diagonal 1"),
        jsx('div', {}, "Gradient Diagonal 2"),
      ]}),
    ];
    
    const gradientCenterContainers = [
      await Container({ variant: "gradient-center", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Gradient Center 1"),
        jsx('div', {}, "Gradient Center 2"),
      ]}),
    ];
    
    const gradientConeContainers = [
      await Container({ variant: "gradient-cone", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Gradient Cone 1"),
        jsx('div', {}, "Gradient Cone 2"),
      ]}),
    ];
    
    const crystalContainers = [
      await Container({ variant: "crystal", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Crystal 1"),
        jsx('div', {}, "Crystal 2"),
      ]}),
    ];
    
    const diagonalStripesContainers = [
      await Container({ variant: "diagonal-stripes", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Diagonal Stripes 1"),
        jsx('div', {}, "Diagonal Stripes 2"),
      ]}),
    ];
    
    const glowContainers = [
      await Container({ variant: "glow", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Glow 1"),
        jsx('div', {}, "Glow 2"),
      ]}),
    ];
    
    const minimalistContainers = [
      await Container({ variant: "minimalist", direction: "column", padding: "md", gap: "sm", children: [
        jsx('div', {}, "Minimalist 1"),
        jsx('div', {}, "Minimalist 2"),
      ]}),
    ];
    
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-3xl font-bold mb-8" }, "所有 Container Variant 測試"),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Solid 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, solidContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Glow 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, glowContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Outline 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, outlineContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Dot 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, dotContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Dashed 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, dashedContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Double 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, doubleContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Ghost 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, ghostContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Minimalist 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, minimalistContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Crystal 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, crystalContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Diagonal Stripes 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, diagonalStripesContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Left 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, gradientLeftContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Center 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, gradientCenterContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Right 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, gradientRightContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Up 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, gradientUpContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Middle 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, gradientMiddleContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Down 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, gradientDownContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Cone 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, gradientConeContainers),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Gradient Diagonal 容器"),
      jsx('div', { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, gradientDiagonalContainers),
      
    ]);
  } catch (error) {
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-2xl font-bold mb-4" }, "載入失敗"),
      jsx('pre', {}, String(error))
    ]);
  }
}
