import { jsx } from "hono/jsx";
import Avatar from "../components/Avatar/index.tsx";

export default async function TestPage() {
  try {
    // 測試 SVG 來源
    const testSvgs = {
      user:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>',
      star: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      heart: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
      check: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    };

    const colors: Array<"primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error"> = ["primary", "secondary", "accent", "info", "success", "warning", "error"];

    // 渲染所有 Avatar variant（使用 icon）
    const solidAvatars = await Promise.all(colors.map(color => 
      Avatar({ svg: testSvgs.user, variant: "solid", size: "md", color })
    ));
    
    const outlineAvatars = await Promise.all(colors.map(color => 
      Avatar({ svg: testSvgs.user, variant: "outline", size: "md", color })
    ));
    
    const ghostAvatars = await Promise.all(colors.map(color => 
      Avatar({ svg: testSvgs.user, variant: "ghost", size: "md", color })
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
      Avatar({ svg: testSvgs.user, variant: "glow", size: "md", color })
    ));

    // 渲染 SVG 來源測試
    const svgAvatars = await Promise.all([
      Avatar({ svg: testSvgs.star, size: "md", variant: "solid", color: "primary" }),
      Avatar({ svg: testSvgs.heart, size: "md", variant: "solid", color: "secondary" }),
      Avatar({ svg: testSvgs.check, size: "md", variant: "solid", color: "accent" }),
    ]);

    // 渲染 Image 來源測試
    const imageAvatars = await Promise.all([
      Avatar({ image: "影像:影像:hono", size: "md", variant: "solid", color: "primary" }),
      Avatar({ image: "影像:影像:surrealDB", size: "md", variant: "solid", color: "secondary" }),
      Avatar({ image: "影像:影像:deno2", size: "md", variant: "solid", color: "accent" }),
    ]);

    // 渲染不同尺寸測試
    const sizes: Array<"xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"> = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
    const sizeAvatars = await Promise.all(sizes.map(size => 
      Avatar({ icon: "圖示:圖示:user", variant: "solid", size, color: "primary" })
    ));

    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-3xl font-bold mb-8" }, "Avatar 組件測試"),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Solid 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...solidAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Glow 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...glowAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Outline 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...outlineAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Dot 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...dotAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Dashed 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...dashedAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Double 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...doubleAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Ghost 頭像"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...ghostAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "SVG 來源"),
      jsx('div', { class: "flex gap-4" }, ...svgAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Image 來源"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...imageAvatars as any),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "不同尺寸"),
      jsx('div', { class: "flex gap-4 items-center" }, ...sizeAvatars as any),
      
    ]);
  } catch (error) {
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-2xl font-bold mb-4" }, "載入失敗"),
      jsx('pre', {}, String(error))
    ]);
  }
}
