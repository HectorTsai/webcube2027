import { jsx } from "hono/jsx";
import Image from "../components/Image/index.tsx";

export default async function TestPage() {
  try {
    // 測試 ID 來源（資料庫圖片）
    const testIds = [
      "影像:影像:hono",
      "影像:影像:surrealDB",
      "影像:影像:deno2"
    ];

    // 渲染 ID 來源測試
    const idImages = await Promise.all(testIds.map(id => 
      Image({ id, alt: `測試圖片 ${id}`, width: "100", height: "100" })
    ));

    // 渲染 src 來源測試（使用 API 路徑）
    const srcImages = await Promise.all([
      Image({ src: "/media/v1/image/影像:影像:hono", alt: "Hono", width: "100", height: "100" }),
      Image({ src: "/media/v1/image/影像:影像:surrealDB", alt: "SurrealDB", width: "100", height: "100" }),
      Image({ src: "/media/v1/image/影像:影像:deno2", alt: "Deno2", width: "100", height: "100" }),
    ]);

    // 測試不同尺寸測試
    const sizes = [
      { width: "50", height: "50" },
      { width: "100", height: "100" },
      { width: "200", height: "200" },
      { width: "300", height: "300" },
    ];
    const sizeImages = await Promise.all(sizes.map(({ width, height }) => 
      Image({ id: "影像:影像:hono", alt: `尺寸 ${width}x${height}`, width, height })
    ));

    // 測試只指定寬度
    const widthOnlyImages = await Promise.all([
      Image({ id: "影像:影像:hono", alt: "寬度 100", width: "100" }),
      Image({ id: "影像:影像:surrealDB", alt: "寬度 100", width: "100" }),
      Image({ id: "影像:影像:deno2", alt: "寬度 100", width: "100" }),
    ]);

    // 測試只指定高度
    const heightOnlyImages = await Promise.all([
      Image({ id: "影像:影像:hono", alt: "高度 100", height: "100" }),
      Image({ id: "影像:影像:surrealDB", alt: "高度 100", height: "100" }),
      Image({ id: "影像:影像:deno2", alt: "高度 100", height: "100" }),
    ]);

    // 測試 lazy loading
    const lazyImages = await Promise.all([
      Image({ id: "影像:影像:hono", alt: "Lazy 1", width: "100", height: "100", loading: "lazy" }),
      Image({ id: "影像:影像:surrealDB", alt: "Lazy 2", width: "100", height: "100", loading: "lazy" }),
    ]);

    // 測試 eager loading
    const eagerImages = await Promise.all([
      Image({ id: "影像:影像:hono", alt: "Eager 1", width: "100", height: "100", loading: "eager" }),
      Image({ id: "影像:影像:surrealDB", alt: "Eager 2", width: "100", height: "100", loading: "eager" }),
    ]);

    // 測試 fallback（使用不存在的 ID）
    const fallbackImages = await Promise.all([
      Image({ id: "影像:影像:不存在的圖片", alt: "Fallback 測試", width: "100", height: "100", fallback: "/media/v1/image/影像:影像:hono" }),
    ]);

    // 測試不同 objectFit 選項
    const objectFitOptions: Array<"fill" | "contain" | "cover" | "none" | "scale-down"> = ["fill", "contain", "cover", "none", "scale-down"];
    const objectFitImages = await Promise.all(objectFitOptions.map(fit => 
      Image({ id: "影像:影像:hono", alt: `Object-fit: ${fit}`, width: "100", height: "100", objectFit: fit })
    ));

    // 為每個 object-fit 圖片添加標籤
    const objectFitWithLabels = objectFitOptions.map((fit, index) => {
      const image = objectFitImages[index];
      return jsx('div', { class: "flex flex-col items-center gap-2" }, [
        image,
        jsx('span', { class: "text-sm" }, String(fit))
      ] as any);
    });

    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-3xl font-bold mb-8" }, "Image 組件測試"),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "ID 來源（資料庫圖片）"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...idImages),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Src 來源（API 路徑）"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...srcImages),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "不同尺寸"),
      jsx('div', { class: "flex gap-4 items-center flex-wrap" }, ...sizeImages),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "只指定寬度（高度自動調整）"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...widthOnlyImages),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "只指定高度（寬度自動調整）"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...heightOnlyImages),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Lazy Loading"),
      jsx('div', { class: "flex gap-4" }, ...lazyImages),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Eager Loading"),
      jsx('div', { class: "flex gap-4" }, ...eagerImages),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "Fallback（不存在的 ID）"),
      jsx('div', { class: "flex gap-4" }, ...fallbackImages),
      
      jsx('h2', { class: "text-2xl font-bold mb-4 mt-8" }, "不同 Object-fit 選項"),
      jsx('div', { class: "flex gap-4 flex-wrap" }, ...objectFitWithLabels as any),
      
    ]);
  } catch (error) {
    return jsx('div', { class: "p-8" }, [
      jsx('h1', { class: "text-2xl font-bold mb-4" }, "載入失敗"),
      jsx('pre', {}, String(error))
    ]);
  }
}
