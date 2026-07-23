/**
 * POST /api/setup
 * 首次安裝 — 設定 L2 連線、建立預設角色與超級管理員
 */

import type { Context } from 'hono';
import { dataPool } from '@dui/database';
import { info } from '@dui/util';

/** 預設角色清單 */
const DEFAULT_ROLES = [
  { id: '使用者:角色:超級管理員', 名稱: { 'zh-tw': '超級管理員', en: 'superadmin' } },
  { id: '使用者:角色:管理員',     名稱: { 'zh-tw': '管理員', en: 'admin' } },
  { id: '使用者:角色:會員',       名稱: { 'zh-tw': '會員', en: 'member' } },
  { id: '使用者:角色:貴賓',       名稱: { 'zh-tw': '貴賓', en: 'vip' } },
  { id: '使用者:角色:黑名單',     名稱: { 'zh-tw': '黑名單', en: 'blacklist' } },
];

export async function POST(c: Context) {
  try {
    const body = await c.req.json();
    const { 管理員帳號, 管理員密碼, l2 } = body;

    if (!管理員帳號 || !管理員密碼) {
      return c.json({ success: false, error: '請填寫管理員帳號與密碼' }, 400);
    }

    // Firestore：驗證上傳的服務帳號金鑰 JSON
    if (l2?.type === 'firestore') {
      if (!l2.credential) {
        return c.json({ success: false, error: '請上傳服務帳號金鑰 JSON 檔' }, 400);
      }
      if (l2.credential.type !== 'service_account') {
        return c.json({ success: false, error: '金鑰檔案錯誤：type 必須為 "service_account"' }, 400);
      }
      if (!l2.credential.project_id || !l2.credential.private_key_id || !l2.credential.private_key) {
        return c.json({ success: false, error: '金鑰檔案缺少必要欄位（project_id / private_key_id / private_key）' }, 400);
      }
    }

    // SQLite：只取檔名，放到 gateway 的 data/ 下
    if (l2?.type === 'sqlite' && l2?.filePath) {
      const fileDir = import.meta.dirname; // .../gateway/data-gateway/routes/api/setup
      const dataDir = fileDir ? `${fileDir}/../../../data` : './data';
      l2.filePath = `${dataDir}/${l2.filePath.split('/').pop() || 'l2.db'}`;
    }

    // 儲存 L2 連線資訊到 L1（加密）
    if (l2) {
      l2.enabled = true;
      const { encrypt } = await import('@dui/util');
      const encrypted = await encrypt(JSON.stringify(l2));
      await dataPool.config?.set('l2_connection', encrypted);
    }

    // 初始化 L2
    await dataPool.initL2();
    const system = dataPool.System;
    if (!system) {
      return c.json({ success: false, error: 'L2 資料庫連線失敗' }, 500);
    }
    await system.initialize('使用者');

    // 建立預設角色
    for (const role of DEFAULT_ROLES) {
      await system.create('使用者', role.id, { 名稱: role.名稱 });
    }

    // 建立超級管理員
    const bcrypt = (await import('bcryptjs')) as any;
    const 密碼雜湊 = await bcrypt.default.hash(管理員密碼, 10);
    const 管理員ID = `使用者:使用者:${管理員帳號}`;
    await system.create('使用者', 管理員ID, {
      帳號: 管理員帳號,
      密碼雜湊,
      角色: ['使用者:角色:超級管理員'],
    });

    await info('DataGateway', '安裝完成');
    return c.json({ success: true });
  } catch (err) {
    return c.json(
      { success: false, error: `安裝失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}
