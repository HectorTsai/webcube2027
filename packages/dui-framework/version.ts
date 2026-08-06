/**
 * Gateway 版本工具
 *
 * 從 Gateway 根目錄的 deno.json 讀取版本號。
 * 所有 Gateway 共用此模組，無需各自實作。
 *
 * gatewayRoot 應以 import.meta.url 解析，而非 Deno.cwd()，以確保
 * 不受執行時期工作目錄影響。範例：
 *
 * ```ts
 * // _layout.tsx：routes/ → gateway root
 * const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
 * const version = await getVersion(ROOT);
 *
 * // routes/api/version/get.ts：routes/api/version/ → gateway root
 * const ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
 * export const GET = createVersionHandler(ROOT);
 * ```
 */

import type { Context } from 'hono';

// ─── 版本讀取（快取） ───────────────────────────────────────

let cachedVersion: string | null = null;

async function readVersion(gatewayRoot: string): Promise<string> {
  if (cachedVersion) return cachedVersion!;
  const text = await Deno.readTextFile(`${gatewayRoot}/deno.json`);
  cachedVersion = JSON.parse(text).version;
  return cachedVersion!;
}

/** 清除版本快取（供測試或重新載入使用） */
export function clearVersionCache(): void {
  cachedVersion = null;
}

/**
 * 取得版本號。
 * @param gatewayRoot Gateway 根目錄的絕對路徑（含尾端斜線不影響）
 */
export async function getVersion(gatewayRoot: string): Promise<string> {
  return await readVersion(gatewayRoot);
}

/**
 * 建立 version GET handler 的 factory function。
 * @param gatewayRoot Gateway 根目錄的絕對路徑
 * @returns Hono GET handler（可直接作為 route GET export）
 */
export function createVersionHandler(gatewayRoot: string) {
  return async (c: Context): Promise<Response> => {
    try {
      const version = await readVersion(gatewayRoot);
      return c.json({ version });
    } catch (err) {
      console.error('[version] Failed to read version:', err);
      return c.json(
        { version: 'unknown', error: err instanceof Error ? err.message : String(err) },
        500,
      );
    }
  };
}