import { jsx } from "hono/jsx";
import Swap from "../components/Swap.tsx";

export default async function TestPage() {
  try {
    const svgSet = {
      sun: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V2m0 20v-2m10-8h-2M4 12H2m17.657-5.657-1.414 1.414M7.757 16.243l-1.414 1.414m0-11.314 1.414 1.414M17.657 16.243l1.414 1.414"/><circle cx="12" cy="12" r="4"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z"/></svg>',
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
