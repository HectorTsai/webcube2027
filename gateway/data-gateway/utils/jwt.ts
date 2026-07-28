/**
 * Data Gateway 專用工具（非跨 gateway 共用）
 *
 * - composeId / parseId：用於 L1 data pool 的 composite ID 處理
 *
 * 共用 JWT 驗證邏輯已移至 @dui/util/jwt，請使用：
 *   import { extractToken, verifyToken, 寫入Cookie並重導 } from '@dui/util/jwt';
 */

/** Build composite ID for data pool queries (format: collection:model:id) */
export function composeId(collection: string, model: string, rawId: string): string {
  return `${collection}:${model}:${rawId}`;
}

/** Parse composite ID back to { collection, model, id } */
export function parseId(compositeId: string): { collection: string; model: string; id: string } {
  const parts = compositeId.split(':');
  return { collection: parts[0], model: parts[1], id: parts[2] };
}
