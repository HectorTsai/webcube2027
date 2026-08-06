/**
 * POST /api/site/apply — 註冊新網站（租戶）
 *
 * 流程：
 *   1. 驗證 domain（正規化 hostname + 檢查是否重複）
 *   2. 建立 L2 `網站資訊` 記錄（模式、設定、資料庫 連線設定）
 *      → 透過 SitePool 快取，延遲寫入 data-gateway（onFlush batch PUT）
 *   3. 若提供 admin → 委託 auth-gateway /api/register 建立 L3 管理員帳號
 *   4. L3 資料庫不需在此初始化 — data-gateway 收到帶 X-Tenant 的請求時自動建立連線
 *
 * Request:  { domain, 名稱, 描述?, 商標?, 模式?, l3?, admin? }
 * Response: { success: true, data: { id, domain, 名稱, 狀態 } }
 */

import type { Context } from 'hono';
import { sitePool, markHasSiteCached } from '../../../../services/site-pool.ts';
import { getAuthGatewayUrl, getDataGatewayUrl } from '../../../../utils/config.ts';
import { error as logError } from '@dui/util';

/** 正規化 domain：去協定、路徑與埠號，轉小寫 hostname */
function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .toLowerCase();
}

/** 驗證 domain 是否為合法 hostname（含 localhost 與 IP） */
function isValidDomain(domain: string): boolean {
  return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(domain);
}

export async function POST(c: Context) {
  try {
    const body = await c.req.json() as Record<string, unknown>;

    // ── 1. 驗證 domain ──
    const rawDomain = typeof body.domain === 'string' ? body.domain.trim() : '';
    const domain = normalizeDomain(rawDomain);
    if (!domain || !isValidDomain(domain)) {
      return c.json({ success: false, error: '無效的 domain（需為合法 hostname）' }, 400);
    }

    const 名稱 = typeof body.名稱 === 'string' ? body.名稱.trim() : '';
    if (!名稱) {
      return c.json({ success: false, error: '缺少網站名稱（名稱）' }, 400);
    }

    // ── 2. 檢查是否已存在 ──
    const existing = await sitePool.getSite(domain);
    if (existing) {
      return c.json({ success: false, error: `網站 ${domain} 已存在` }, 409);
    }

    // ── 3. 組裝網站資訊記錄（欄位依 網站資訊 Model 定義） ──
    const l3 = (body.l3 && typeof body.l3 === 'object' ? body.l3 : {}) as Record<string, unknown>;
    // 連線設定欄位依 @dui/database 的 L2ConnectionInfo 契約（type / filePath / host ...），
    // data-gateway 依此建立 L3 連線；l3.adapter / l3.path 為舊名稱，保留相容讀取。
    const l3Connection: Record<string, unknown> = {
      type: (l3.type as string) || (l3.adapter as string) || 'sqlite',
      ...(l3.host ? { host: l3.host } : {}),
      ...(l3.port ? { port: l3.port } : {}),
      ...(l3.username ? { username: l3.username } : {}),
      ...(l3.password ? { password: l3.password } : {}),
      ...(l3.database ? { database: l3.database } : {}),
      ...(l3.namespace ? { namespace: l3.namespace } : {}),
      ...(l3.credential ? { credential: l3.credential } : {}),
      // SQLite 預設以 domain 為檔名（data-gateway 的 data 目錄下）
      filePath: (l3.filePath as string) || (l3.path as string) || `./data/${domain}.db`,
    };

    const admin = (body.admin && typeof body.admin === 'object' ? body.admin : undefined) as
      | { 帳號?: string; 密碼?: string; 名稱?: string }
      | undefined;

    const record: Record<string, unknown> = {
      id: sitePool.buildId(domain),
      domain,
      網址: domain,
      名稱,
      描述: typeof body.描述 === 'string' ? body.描述 : undefined,
      商標: typeof body.商標 === 'string' ? body.商標 : undefined,
      模式: typeof body.模式 === 'string' ? body.模式 : 'production',
      設定: {},
      // 資料庫欄位為 L3 連線設定的 JSON 字串（明文；data-gateway 的 decrypt 對非 enc: 前綴直接 pass-through）
      資料庫: JSON.stringify(l3Connection),
      狀態: 'active',
      開始日期: new Date().toISOString(),
      作者: admin?.帳號,
    };

    // ── 4. 寫入 SitePool（延遲寫入 L2） ──
    sitePool.upsert(domain, record);

    // ── 4.1 立即 flush 至 L2（重要）──
    // 委託 auth-gateway 建立管理員前，網站記錄必須已落庫：
    // 管理員是寫入 L3（data-gateway 依 L2 網站資訊的 `資料庫` 欄位建立 L3 連線），
    // 若仍停留在 pool（預設 5 秒 batch flush），auth-gateway 會查不到租戶 L3 而失敗。
    try {
      await sitePool.flushToStorage();
    } catch (err) {
      // flush 失敗 → 回滾網站記錄，維持一致性
      await sitePool.removeSite(domain);
      return c.json({
        success: false,
        error: `網站記錄寫入 L2 失敗：${err instanceof Error ? err.message : String(err)}`,
        已回滾: true,
      }, 500);
    }

    // ── 5. 委託 auth-gateway 建立網站管理員（可選） ──
    let adminResult: { success: boolean; error?: string } = { success: true };
    if (admin?.帳號 && admin?.密碼) {
      const authUrl = await getAuthGatewayUrl();
      if (!authUrl) {
        // 缺 auth-gateway → 回滾網站記錄
        await sitePool.removeSite(domain);
        return c.json({ success: false, error: 'auth-gateway 尚未設定，無法建立管理員帳號' }, 500);
      }
      try {
        const res = await fetch(`${authUrl}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            帳號: admin.帳號,
            密碼: admin.密碼,
            tenant: domain,
            名稱: admin.名稱,
          }),
        });
        const json = await res.json();
        adminResult = json.success
          ? { success: true }
          : { success: false, error: json.error || '建立管理員失敗' };
      } catch (err) {
        adminResult = { success: false, error: err instanceof Error ? err.message : String(err) };
      }

      if (!adminResult.success) {
        // 管理員建立失敗 → 回滾網站記錄（維持一致性）
        await sitePool.removeSite(domain);
        return c.json({ success: false, error: adminResult.error, 已回滾: true }, 500);
      }
    }

    // 確認 data-gateway 已註冊（避免靜默失敗：pool 是延遲寫入，無法在此即時驗證，交由 flush 處理）
    const dgUrl = await getDataGatewayUrl();
    if (!dgUrl) {
      // 理論上安裝後必有，但仍防禦性檢查
      await sitePool.removeSite(domain);
      return c.json({ success: false, error: 'data-gateway 尚未設定' }, 500);
    }

    // 申請成功 → 立即更新「已有網站」快取，避免 30 秒內仍被導向申請頁
    markHasSiteCached(true);

    return c.json({
      success: true,
      data: {
        id: record.id,
        domain,
        名稱,
        狀態: 'active',
        admin_created: adminResult.success && !!admin?.帳號,
      },
    });
  } catch (err) {
    logError('SiteGateway', `[site/apply] 失敗：${err instanceof Error ? err.message : String(err)}`);
    return c.json({ success: false, error: '伺服器內部錯誤' }, 500);
  }
}
