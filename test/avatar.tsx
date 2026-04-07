import { jsx } from "hono/jsx";
import Icon from "../components/Icon/index.tsx";
import Image from "../components/Image/index.tsx";

export default async function TestPage() {
  // 測試載入 Avatar index
  try {
    const AvatarModule = await import("../components/Avatar/index.tsx");
    const Avatar = AvatarModule.default;
    
    const colors = ["primary", "secondary", "accent", "neutral", "info", "success", "warning", "error"];
    
    // 渲染所有 Avatar variant（使用 icon）
    const solidAvatars = await Promise.all(colors.map(color => 
      Avatar({ icon: "圖示:圖示:user", variant: "solid", size: "md", color })
    ));
    
    const outlineAvatars = await Promise.all(colors.map(color => 
      Avatar({ icon: "圖示:圖示:user", variant: "outline", size: "md", color })
    ));
    
    const ghostAvatars = await Promise.all(colors.map(color => 
      Avatar({ icon: "圖示:圖示:user", variant: "ghost", size: "md", color })
    ));
    
    const dotAvatars = await Promise.all(colors.map(color => 
      Avatar({ icon: "圖示:圖示:user", variant: "dot", size: "md", color })
    ));
    
    const dashedAvatars = await Promise.all(colors.map(color => 
      Avatar({ icon: "圖示:圖示:user", variant: "dashed", size: "md", color })
    ));
    
    const doubleAvatars = await Promise.all(colors.map(color => 
      Avatar({ icon: "圖示:圖示:user", variant: "double", size: "md", color })
    ));
    
    const glowAvatars = await Promise.all(colors.map(color => 
      Avatar({ icon: "圖示:圖示:user", variant: "glow", size: "md", color })
    ));
    
    const minimalistAvatars = await Promise.all(colors.map(color => 
      Avatar({ icon: "圖示:圖示:user", variant: "minimalist", size: "md", color })
    ));
    
    // 測試使用圖片的 Avatar
    const userAvatar = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="40" r="20" fill="currentColor"/>
      <ellipse cx="50" cy="90" rx="35" ry="25" fill="currentColor"/>
    </svg>`;
    
    const imageAvatars = await Promise.all(colors.map(color => 
      Avatar({ image: userAvatar, variant: "solid", size: "md", color })
    ));
    
    // 測試不同尺寸
    const sizes = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
    const sizeAvatars = await Promise.all(sizes.map((size) => 
      Avatar({ icon: "圖示:圖示:user", variant: "solid", size, color: "primary" })
    ));
    
    // 測試動畫效果
    const animationAvatars = [
      await Avatar({ icon: "圖示:圖示:user", variant: "solid", size: "md", color: "info", className: "animate-bounce repeat-infinite" }),
      await Avatar({ icon: "圖示:圖示:user", variant: "solid", size: "md", color: "warning", className: "animate-spin repeat-infinite" }),
      await Avatar({ icon: "圖示:圖示:user", variant: "solid", size: "md", color: "warning", className: "animate-jello repeat-infinite" }),
      await Avatar({ icon: "圖示:圖示:user", variant: "solid", size: "md", color: "info", className: "animate-heart-beat repeat-infinite" }),
      await Avatar({ icon: "圖示:圖示:user", variant: "solid", size: "md", color: "warning", className: "animate-tada repeat-infinite" }),
      await Avatar({ icon: "圖示:圖示:user", variant: "solid", size: "md", color: "warning", className: "animate-wobble repeat-infinite" })
    ];
    
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-3xl font-bold mb-8" }, "所有 Avatar Variant 測試"),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Solid 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, solidAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Glow 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, glowAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Outline 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, outlineAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Dot 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, dotAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Dashed 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, dashedAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Double 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, doubleAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Ghost 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ghostAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Minimalist 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, minimalistAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "圖片頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, imageAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "不同尺寸"),
      jsx('div', { class: "flex gap-4 items-center" }, sizeAvatars),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "動畫效果"),
      jsx('div', { class: "flex gap-4" }, animationAvatars),
      
    ]);
  } catch (error) {
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-2xl font-bold mb-4" }, "載入失敗"),
      jsx('pre', {}, String(error))
    ]);
  }
}
