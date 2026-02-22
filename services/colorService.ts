/**
 * Color service for managing dynamic daisyUI themes with oklch
 */

import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";

interface OkLchColor {
  l: number; // lightness 0-100%
  c: number; // chroma
  h: number; // hue 0-360
}

interface DaisyTheme {
  // Primary colors
  p: OkLchColor;
  pc: OkLchColor;
  // Secondary colors
  s: OkLchColor;
  sc: OkLchColor;
  // Accent colors
  a: OkLchColor;
  ac: OkLchColor;
  // Neutral colors
  n: OkLchColor;
  nc: OkLchColor;
  // Base colors
  b1: OkLchColor;
  b2: OkLchColor;
  b3: OkLchColor;
  bc: OkLchColor;
  // Info colors
  in: OkLchColor;
  inc: OkLchColor;
  // Success colors
  su: OkLchColor;
  suc: OkLchColor;
  // Warning colors
  wa: OkLchColor;
  wac: OkLchColor;
  // Error colors
  er: OkLchColor;
  erc: OkLchColor;
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

export class ColorService {
  private themesFile = "./data/themes.json";

  async init() {
    await ensureDir("./data");
  }

  async getTheme(userId: string = "default"): Promise<DaisyTheme> {
    try {
      const data = await Deno.readTextFile(this.themesFile);
      const themes = JSON.parse(data);
      return themes[userId] || DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  async setTheme(theme: Partial<DaisyTheme>, userId: string = "default") {
    let themes = {};
    try {
      const data = await Deno.readTextFile(this.themesFile);
      themes = JSON.parse(data);
    } catch {
      // File doesn't exist, start with empty
    }

    const currentTheme = themes[userId] || DEFAULT_THEME;
    const newTheme = { ...currentTheme, ...theme };
    themes[userId] = newTheme;

    await Deno.writeTextFile(this.themesFile, JSON.stringify(themes, null, 2));

    // Update CSS variables
    this.updateCSSVariables(newTheme);

    return newTheme;
  }

  private updateCSSVariables(theme: DaisyTheme) {
    const cssVars: Record<string, string> = {};
    Object.entries(theme).forEach(([key, color]) => {
      cssVars[`--${key}`] = `${color.l}% ${color.c} ${color.h}`;
    });

    // Update :root
    if (typeof document !== "undefined") {
      Object.entries(cssVars).forEach(([prop, value]) => {
        document.documentElement.style.setProperty(prop, value);
      });
    }
  }

  getDefaultTheme(): DaisyTheme {
    return DEFAULT_THEME;
  }

  // Convert oklch to string
  oklchToString(color: OkLchColor): string {
    return `${color.l}% ${color.c} ${color.h}`;
  }

  // Convert string to oklch
  stringToOkLch(str: string): OkLchColor {
    const parts = str.split(" ");
    return {
      l: parseFloat(parts[0]),
      c: parseFloat(parts[1]),
      h: parseFloat(parts[2]),
    };
  }
}

export const colorService = new ColorService();
