// Multilingual Object Library
// A comprehensive library for handling multilingual content with intelligent content loading

// Core multilingual classes
export { default as MultilingualObject } from './src/core/base.ts';
export { default as MultilingualString } from './src/implementations/string.ts';
export { default as MultilingualBinary } from './src/implementations/binary.ts';
export { default as MultilingualSmartContent } from './src/implementations/smart-content.ts';

// Smart content utilities
export { SmartContent } from './src/core/content/smart-content.ts';
export { ContentRenderer } from './src/core/content/renderer.ts';

// Translation services (uses TranslationProvider from @dui/translate-google)
export { registerTranslation, getTranslation, clearTranslation } from './src/core/translation.ts';
export type { TranslationProvider } from '@dui/translate-google';

// Type definitions
export { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGE_SET } from './src/core/types.ts';
export type { SupportedLanguage, MultilingualData } from './src/core/types.ts';

// Resource handling
export { ResourceHandler } from './src/utils/file.ts';

// ── Re-exports from @dui/util/common for backward compatibility ──
export { StringUtils } from '@dui/util/common/string';
export { ArrayUtils } from '@dui/util/common/array';
export { 格式對應表, getFormatFromExt, getFormatFromMime } from '@dui/util/common/file';
export type { SupportedFormat, FileMappingItem } from '@dui/util/common/file';