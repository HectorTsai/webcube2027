/**
 * 翻譯服務介面與全域註冊器
 *
 * 採用 TranslationProvider 介面（定義於 @dui/translate-google），
 * 預設使用 GoogleTranslationProvider。
 *
 * 以動態 import() 載入 GoogleTranslationProvider，避免在只使用自訂
 * AI Provider 的環境中強制依賴 @dui/translate-google。
 */

import type { TranslationProvider } from '@dui/translate-google';

// ── Types ──

export type { TranslationProvider };

// ── 預設翻譯服務（動態載入，避免硬性依賴） ──

let _defaultProvider: TranslationProvider | null = null;

async function getDefaultProvider(): Promise<TranslationProvider> {
  if (!_defaultProvider) {
    const { GoogleTranslationProvider } = await import('@dui/translate-google');
    _defaultProvider = new GoogleTranslationProvider();
  }
  return _defaultProvider;
}

// ── 全域註冊器 ──

let globalTranslationService: TranslationProvider | null = null;

/**
 * 註冊翻譯服務
 * @param service 翻譯服務實例
 */
export function registerTranslation(service: TranslationProvider): void {
  globalTranslationService = service;
}

/**
 * 取得已註冊的翻譯服務
 * @returns 翻譯服務實例，如果未註冊則返回預設 Google Translate 服務
 */
export async function getTranslation(): Promise<TranslationProvider> {
  return globalTranslationService || await getDefaultProvider();
}

/**
 * 清除已註冊的翻譯服務
 */
export function clearTranslation(): void {
  globalTranslationService = null;
}