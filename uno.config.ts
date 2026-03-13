import { webcubePreset } from './presets/webcube.ts';
import { presetWind4, presetIcons, presetTypography } from 'unocss';

export default {
  presets: [
    presetIcons(),
    presetTypography(),
    presetWind4(),
    webcubePreset()
  ],
  theme: {
    // 覆蓋預設的顏色處理，避免 color-mix
    colors: {
      // 直接使用 oklch 值，不使用 color-mix
      'blue-500': 'oklch(62.3% 0.214 259.815)',
      'red-500': 'oklch(63.7% 0.237 25.331)',
      'green-500': 'oklch(62.7% 0.194 149.214)',
      // 其他顏色...
    }
  },
  // 禁用 color-mix
  postprocess: (util) => {
    util.entries.forEach((i) => {
      if (i[0].startsWith('background-color:color-mix')) {
        // 提取實際顏色值
        const match = i[1].match(/\/\* (.+) \*\//);
        if (match) {
          i[0] = `background-color:${match[1]}`;
        }
      }
      if (i[0].startsWith('color:color-mix')) {
        const match = i[1].match(/\/\* (.+) \*\//);
        if (match) {
          i[0] = `color:${match[1]}`;
        }
      }
    });
  }
}
