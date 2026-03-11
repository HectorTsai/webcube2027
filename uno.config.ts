import { webcubePreset } from './presets/webcube.ts';
import { presetWind4, presetIcons, presetTypography } from 'unocss';

export default {
  presets: [
    presetIcons(),
    presetTypography(),
    presetWind4(),
    webcubePreset()
  ],
}
