import { jsx } from "hono/jsx";
import Swap from "../components/Swap.tsx";

export default async function TestPage() {
  try {
    const svgSet = {
      sun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
      moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
      play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3.868 19 12 5 20.132z"/></svg>',
      pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
    };

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
        title: "Icon ID 互換",
        props: { fromId: "圖示:圖示:user", toId: "圖示:圖示:phone", animateIn: "slide-in-from-top", animateOut: "slide-out-to-bottom" },
      },
      {
        title: "圖片來源互換",
        props: { fromSrc: "https://placekitten.com/80/80", toSrc: "https://picsum.photos/80", animateIn: "zoom-in", animateOut: "zoom-out" },
      },
    ];

    const sections = await Promise.all(swapConfigs.map(async ({ title, props }) => {
      const renderedSwap = await Swap(props);
      const swapNode = renderedSwap as unknown as string;
      return jsx("div", { class: "mb-10" }, [
        jsx("h2", { class: "text-2xl font-bold mb-4" }, title),
        jsx("label", { class: "flex items-center gap-4" }, [
          jsx("span", { class: "font-medium" }, "點擊切換"),
          swapNode,
        ]),
      ]);
    }));

    return jsx("div", { class: "p-8" }, [
      jsx("h1", { class: "text-3xl font-bold mb-8" }, "Swap 組件測試"),
      sections,
    ]);
  } catch (error) {
    return jsx("div", { class: "p-8" }, [
      jsx("h1", { class: "text-2xl font-bold mb-4" }, "載入失敗"),
      jsx("pre", {}, String(error)),
    ]);
  }
}
