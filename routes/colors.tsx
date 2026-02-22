import { createSignal } from "@dreamer/view";
import Button from "../components/實心/按鈕.tsx";

interface DaisyTheme {
  // Primary colors
  p: { l: number; c: number; h: number };
  pc: { l: number; c: number; h: number };
  // Secondary colors
  s: { l: number; c: number; h: number };
  sc: { l: number; c: number; h: number };
  // Accent colors
  a: { l: number; c: number; h: number };
  ac: { l: number; c: number; h: number };
  // Neutral colors
  n: { l: number; c: number; h: number };
  nc: { l: number; c: number; h: number };
  // Base colors
  b1: { l: number; c: number; h: number };
  b2: { l: number; c: number; h: number };
  b3: { l: number; c: number; h: number };
  bc: { l: number; c: number; h: number };
  // Info colors
  in: { l: number; c: number; h: number };
  inc: { l: number; c: number; h: number };
  // Success colors
  su: { l: number; c: number; h: number };
  suc: { l: number; c: number; h: number };
  // Warning colors
  wa: { l: number; c: number; h: number };
  wac: { l: number; c: number; h: number };
  // Error colors
  er: { l: number; c: number; h: number };
  erc: { l: number; c: number; h: number };
}

const DEFAULT_THEME: DaisyTheme = {
  p: { l: 65, c: 0.2, h: 240 },
  pc: { l: 98, c: 0.02, h: 240 },
  s: { l: 65, c: 0.2, h: 280 },
  sc: { l: 98, c: 0.02, h: 280 },
  a: { l: 75, c: 0.2, h: 160 },
  ac: { l: 15, c: 0.02, h: 160 },
  n: { l: 30, c: 0.02, h: 240 },
  nc: { l: 90, c: 0.02, h: 240 },
  b1: { l: 98, c: 0.02, h: 240 },
  b2: { l: 95, c: 0.02, h: 240 },
  b3: { l: 90, c: 0.02, h: 240 },
  bc: { l: 15, c: 0.02, h: 240 },
  in: { l: 70, c: 0.15, h: 200 },
  inc: { l: 98, c: 0.02, h: 200 },
  su: { l: 75, c: 0.15, h: 140 },
  suc: { l: 15, c: 0.02, h: 140 },
  wa: { l: 80, c: 0.15, h: 70 },
  wac: { l: 15, c: 0.02, h: 70 },
  er: { l: 70, c: 0.2, h: 20 },
  erc: { l: 98, c: 0.02, h: 20 },
};

export default function ColorsPage() {
  const [theme, setTheme] = createSignal(DEFAULT_THEME);
  const [loading, setLoading] = createSignal(false);

  const updateColor = (
    key: keyof DaisyTheme,
    field: "l" | "c" | "h",
    value: number,
  ) => {
    const newTheme = { ...theme()! };
    newTheme[key] = { ...newTheme[key], [field]: value };
    setTheme(newTheme);

    // Update CSS variables
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      Object.entries(newTheme).forEach(([k, v]) => {
        root.style.setProperty(`--${k}`, `${v.l}% ${v.c} ${v.h}`);
      });
    }
  };

  const resetToDefault = () => {
    setLoading(true);
    setTheme(DEFAULT_THEME);

    // Update CSS variables
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      Object.entries(DEFAULT_THEME).forEach(([k, v]) => {
        root.style.setProperty(`--${k}`, `${v.l}% ${v.c} ${v.h}`);
      });
    }

    setTimeout(() => setLoading(false), 500);
  };

  const ColorEditor = (
    { label, colorKey }: { label: string; colorKey: keyof DaisyTheme },
  ) => {
    if (!theme()) return null;

    const color = theme()![colorKey];
    return (
      <div class="space-y-2">
        <h3 class="text-sm font-medium">{label}</h3>
        <div class="flex gap-2">
          <label class="flex-1">
            <span class="text-xs">L</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={color.l}
              onChange={(e) =>
                updateColor(colorKey, "l", parseFloat(e.target.value))}
              class="w-full px-2 py-1 border rounded text-sm"
            />
          </label>
          <label class="flex-1">
            <span class="text-xs">C</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={color.c}
              onChange={(e) =>
                updateColor(colorKey, "c", parseFloat(e.target.value))}
              class="w-full px-2 py-1 border rounded text-sm"
            />
          </label>
          <label class="flex-1">
            <span class="text-xs">H</span>
            <input
              type="number"
              min="0"
              max="360"
              step="1"
              value={color.h}
              onChange={(e) =>
                updateColor(colorKey, "h", parseFloat(e.target.value))}
              class="w-full px-2 py-1 border rounded text-sm"
            />
          </label>
        </div>
      </div>
    );
  };

  if (!theme()) {
    return <div class="p-4">載入中...</div>;
  }

  return (
    <div class="p-4 max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">daisyUI 主題編輯器 (oklch)</h1>

      <div class="mb-4">
        <Button onClick={resetToDefault} 停用={loading()}>
          {loading() ? "重置中..." : "重置為預設"}
        </Button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Primary */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">主要色 (Primary)</h2>
          <ColorEditor label="主要" colorKey="p" />
          <ColorEditor label="內容" colorKey="pc" />
        </div>

        {/* Secondary */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">次要色 (Secondary)</h2>
          <ColorEditor label="主要" colorKey="s" />
          <ColorEditor label="內容" colorKey="sc" />
        </div>

        {/* Accent */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">強調色 (Accent)</h2>
          <ColorEditor label="主要" colorKey="a" />
          <ColorEditor label="內容" colorKey="ac" />
        </div>

        {/* Neutral */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">中性色 (Neutral)</h2>
          <ColorEditor label="主要" colorKey="n" />
          <ColorEditor label="內容" colorKey="nc" />
        </div>

        {/* Base */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">基礎色 (Base)</h2>
          <ColorEditor label="Base 1" colorKey="b1" />
          <ColorEditor label="Base 2" colorKey="b2" />
          <ColorEditor label="Base 3" colorKey="b3" />
          <ColorEditor label="內容" colorKey="bc" />
        </div>

        {/* Info */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">資訊色 (Info)</h2>
          <ColorEditor label="主要" colorKey="in" />
          <ColorEditor label="內容" colorKey="inc" />
        </div>

        {/* Success */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">成功色 (Success)</h2>
          <ColorEditor label="主要" colorKey="su" />
          <ColorEditor label="內容" colorKey="suc" />
        </div>

        {/* Warning */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">警告色 (Warning)</h2>
          <ColorEditor label="主要" colorKey="wa" />
          <ColorEditor label="內容" colorKey="wac" />
        </div>

        {/* Error */}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">錯誤色 (Error)</h2>
          <ColorEditor label="主要" colorKey="er" />
          <ColorEditor label="內容" colorKey="erc" />
        </div>
      </div>

      <div class="mt-8">
        <h2 class="text-lg font-semibold mb-4">預覽</h2>
        <div class="flex flex-wrap gap-2">
          <Button 顏色="主要">主要按鈕</Button>
          <Button 顏色="次要">次要按鈕</Button>
          <Button 顏色="強調">強調按鈕</Button>
          <Button 顏色="資訊">資訊按鈕</Button>
          <Button 顏色="成功">成功按鈕</Button>
          <Button 顏色="警告">警告按鈕</Button>
          <Button 顏色="錯誤">錯誤按鈕</Button>
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          <Button 顏色="主要" 外框>主要輪廓</Button>
          <Button 顏色="次要" 外框>次要輪廓</Button>
          <Button 顏色="強調" 外框>強調輪廓</Button>
        </div>
      </div>
    </div>
  );
}
