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

// Translation services
export { type TranslationInterface, DefaultTranslation, registerTranslation, getTranslation, clearTranslation } from './src/core/translation.ts';

// Type definitions and utilities
export { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGE_SET } from './src/core/types.ts';
export type { SupportedLanguage, MultilingualData } from './src/core/types.ts';
export type { SupportedFormat, FileMappingItem } from './src/utils/file/formats.ts';
export { 格式對應表, getFormatFromExt, getFormatFromMime } from './src/utils/file/formats.ts';

// Resource handling
export { ResourceHandler } from './src/utils/file/handler.ts';

// String and array utilities
export { StringUtils, ArrayUtils } from './src/utils/extensions/index.ts';
