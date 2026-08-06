/**
 * @dui/framework — Gateway 健康檢查模組
 *
 * 提供共用的 `createHealthHandler()`，確保所有 Gateway 的 `/health` 回傳一致的
 * 標準欄位（status / service / version / uptime），並允許各 Gateway 以 `extend`
 * callback 加入專屬欄位（如 data-gateway 的 L1/L2/L3 狀態、
 * auth-gateway 的 account_pool 與 data-gateway 代理狀態）。
 *
 * 使用範例：
 *
 * ```ts
 * // data-gateway: routes/api/health/get.ts
 * import { createHealthHandler, getVersion } from '@dui/framework';
 * import { getDbManager } from '../../../services/db-manager.ts';
 *
 * const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname.replace(/\/$/, ''));
 *
 * export const GET = createHealthHandler(ROOT, 'data-gateway', async (base) => ({
 *   l1: getDbManager().L1 ? 'connected' : 'disconnected',
 *   l2: getDbManager().System ? 'connected' : 'disconnected',
 *   // ...
 * }));
 * ```
 *
 * @module
 */

import type { Context } from 'hono';
import { getVersion } from './version.ts';

/** `extend` callback 接收的基礎資訊 */
export interface HealthBaseInfo {
  version: string;
  uptime: number;
}

/** `extend` callback 型別：回傳的物件會被 merge 進最終 response */
export type HealthExtend = (
  info: HealthBaseInfo,
) => Record<string, unknown> | Promise<Record<string, unknown>>;

/**
 * 建立統一的 `/health` GET handler。
 *
 * @param gatewayRoot  Gateway 根目錄絕對路徑（用於讀取 `deno.json` 版本號）
 * @param serviceName  Gateway 名稱（如 `'data-gateway'`），寫入 response 的 `service` 欄位
 * @param extend       選用 callback，可回傳 gateway 專屬欄位
 * @returns            Hono GET handler
 */
export function createHealthHandler(
  gatewayRoot: string,
  serviceName: string,
  extend?: HealthExtend,
) {
  const startedAt = Date.now();

  return async (c: Context): Promise<Response> => {
    try {
      const version = await getVersion(gatewayRoot);
      const base: HealthBaseInfo = {
        version,
        uptime: Date.now() - startedAt,
      };
      const extra = (await extend?.(base)) ?? {};
      return c.json({ status: 'ok', service: serviceName, ...base, ...extra });
    } catch (err) {
      console.error(`[health/${serviceName}] Failed:`, err);
      return c.json(
        {
          status: 'error',
          service: serviceName,
          error: err instanceof Error ? err.message : String(err),
        },
        500,
      );
    }
  };
}