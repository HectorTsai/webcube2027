/**
 * @dui/translate-google
 *
 * Google Translate API client for Deno — no API key required.
 * Uses the public translate.google.com endpoint.
 */

export { GoogleTranslationProvider, type TranslationProvider } from './google.ts';
export { generateGoogleTranslateToken } from './google_token.ts';