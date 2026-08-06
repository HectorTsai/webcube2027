/**
 * GET /api/version
 *
 * 回傳 auth-gateway 目前版本號（從 deno.json 動態讀取）。
 * handler 由 @dui/framework 提供，所有 Gateway 共用。
 */

import { createVersionHandler } from '@dui/framework';

const ROOT = decodeURIComponent(new URL('../../../', import.meta.url).pathname.replace(/\/$/, ''));
export const GET = createVersionHandler(ROOT);