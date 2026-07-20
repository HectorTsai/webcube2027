/**
 * 翻譯服務介面
 * 讓使用者可以自行注入翻譯實作
 */
export interface TranslationInterface {
  /**
   * 執行翻譯
   * @param from 來源語言
   * @param to 目標語言
   * @param text 要翻譯的文字
   * @param host 主機位址（可選，取決於具體實作）
   * @returns 翻譯後的文字
   */
  translate(
    from: string,
    to: string,
    text: string,
    host?: string
  ): Promise<string>;
}

import { GoogleTranslation } from './providers/google.ts';

/**
 * 預設翻譯服務：目前採用 Google Translate 實作
 */
export class DefaultTranslation extends GoogleTranslation {}

/**
 * 全域翻譯服務註冊器
 */
let globalTranslationService: TranslationInterface | null = null;

/**
 * 註冊翻譯服務
 * @param service 翻譯服務實例
 */
export function registerTranslation(service: TranslationInterface): void {
  globalTranslationService = service;
}

/**
 * 取得已註冊的翻譯服務
 * @returns 翻譯服務實例，如果未註冊則返回預設服務
 */
export function getTranslation(): TranslationInterface {
  return globalTranslationService || new DefaultTranslation();
}

/**
 * 清除已註冊的翻譯服務
 */
export function clearTranslation(): void {
  globalTranslationService = null;
}
