import { jsx } from "hono/jsx";
import Icon from "../components/Icon/index.tsx";

export default async function TestPage() {
  // 測試 Icon 組件
  try {
    // 測試 SVG 來源
    const testIcons = {
      star: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      heart: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
      check: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    };

    // 測試 ID 來源
    const testIds = ["圖示:圖示:user", "圖示:圖示:home", "圖示:圖示:phone", "圖示:圖示:中華民國"];

    // 渲染 SVG 來源測試
    const svgIcons = await Promise.all([
      Icon({ svg: testIcons.star, size: "md" }),
      Icon({ svg: testIcons.heart, size: "md" }),
      Icon({ svg: testIcons.check, size: "md" }),
    ]);

    // 渲染 ID 來源測試
    const idIcons = await Promise.all(testIds.map(id => 
      Icon({ id, size: "md" })
    ));

    // 渲染 src 來源測試
    const srcIcons = await Promise.all([
      Icon({ src: "/media/v1/icon/user.svg", size: "md" }),
      Icon({ src: "/media/v1/icon/home.svg", size: "md" }),
      Icon({ src: "/media/v1/icon/info.svg", size: "md" }),
    ]);

    // 渲染不同尺寸測試（使用國旗）
    const sizes = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
    const sizeIcons = await Promise.all(sizes.map(size => 
      Icon({ id: "圖示:圖示:中華民國", size })
    ));

    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-3xl font-bold mb-8" }, "Icon 組件測試"),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "SVG 來源"),
      jsx('div', { class: "flex gap-4" }, svgIcons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "ID 來源"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, idIcons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Src 來源"),
      jsx('div', { class: "flex gap-4" }, srcIcons),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "不同尺寸（國旗）"),
      jsx('div', { class: "flex gap-4 items-center" }, sizeIcons),
      
    ]);
  } catch (error) {
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-2xl font-bold mb-4" }, "載入失敗"),
      jsx('pre', {}, String(error))
    ]);
  }
}

