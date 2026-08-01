export { InnerAPI, 設定App, 取得域名 } from './backend/inner-api.ts';
export { logger, debug, info, warn, error } from './common/logger.ts';
export { encrypt, decrypt, ensureKey, registerKey } from './backend/crypto.ts';
export { default as SecretString } from './backend/secretstring.ts';
export {
  ErrorCode, type ErrorCodeType,
  type SourceType,
  type SuccessResponse, type ErrorResponse, type ApiResponse,
  type PaginationInfo, type PaginatedData,
  success, paginated, errorRes, Errors,
} from './backend/response.ts';

// ── Config Store (persistent KV for gateway instance config) ──
export { ConfigStore } from './config-store.ts';

// ── Common Utilities (from dui-multilanguage migration) ──
export { StringUtils } from './common/string.ts';
export { ArrayUtils } from './common/array.ts';
export { 格式對應表, getFormatFromExt, getFormatFromMime } from './common/file.ts';
export type { SupportedFormat, FileMappingItem } from './common/file.ts';
