/**
 * POST /api/site/apply
 * 申請新網站 — 建立 網站資訊 記錄（含加密的 L3 連線資訊）並建立網站管理員
 *
 * 請求主體：
 * {
 *   網址: "https://example.com",
 *   名稱: { "zh-tw": "範例網站", "en": "Example Site" },
 *   描述: { "zh-tw": "說明", "en": "Description" },
 *   商標: "Example",
 *   模式: "PUBLIC",
 *   管理員帳號: "admin",
 *   管理員密碼: "password",
 *   l3: { type: "mongodb", ... }
 * }
 *
 * 處理流程：
 * 1. 驗證必要欄位（含管理員帳密）
 * 2. 加密 L3 連線資訊
 * 3. 寫入 L2 網站資訊 collection（ID: 網站資訊:網站資訊:{host}）
 * 4. 連接 L3，初始化 collection
 * 5. 以 bcrypt 雜湊管理員密碼，建立使用者記錄
 */

import type { Context } from 'hono';
import { getDbManager } from '../../../../services/db-manager.ts';
import { info, encrypt } from '@dui/util';

export const POST = async (c: Context) => {
  try {
    const body = await c.req.json();
    const {
      網址, 名稱, 描述, 商標, 模式, 佈景主題, 語言, 預設語言,
      管理員帳號, 管理員密碼, l3,
    } = body;

    // ── 1. 驗證必要欄位 ──
    if (!網址) {
      return c.json({ success: false, error: '請填寫網站網址' }, 400);
    }
    if (!名稱 || Object.keys(名稱).length === 0) {
      return c.json({ success: false, error: '請填寫網站名稱（至少一種語言）' }, 400);
    }
    if (!l3 || !l3.type) {
      return c.json({ success: false, error: '請設定 L3 資料庫連線資訊' }, 400);
    }
    if (!管理員帳號 || !管理員密碼) {
      return c.json({ success: false, error: '請填寫管理員帳號與密碼' }, 400);
    }

    // 驗證網址格式，取 hostname 作為租戶識別 ID（相容無 protocol 的輸入）
    let host: string;
    try {
      const rawUrl = 網址.startsWith('http') ? 網址 : `http://${網址}`;
      host = new URL(rawUrl).hostname;
    } catch {
      return c.json({ success: false, error: '網址格式不正確' }, 400);
    }

    // ── 2. 加密 L3 連線資訊 ──
    const 資料庫 = await encrypt(JSON.stringify({ ...l3, enabled: true }));

    // ── 3. 寫入 L2 網站資訊 collection ──
    const system = getDbManager().System;
    if (!system) {
      return c.json({ success: false, error: 'L2 資料庫尚未就緒' }, 500);
    }

    await system.initialize('網站資訊');

    const now = new Date().toISOString();
    const id = `網站資訊:網站資訊:${host}`;

    await system.create('網站資訊', id, {
      網址,  // 保留完整的原始網址字串
      名稱: 名稱 || {},
      描述: 描述 || {},
      商標: 商標 || '',
      模式: 模式 || 'PUBLIC',
      佈景主題: 佈景主題 || '佈景主題/佈景主題/經典藍',
      配色: body.配色 || '',
      骨架: body.骨架 || '',
      設定: body.設定 || {},
      主選單: body.主選單 || ['頁面:頁面:home'],
      語言: 語言 || ['zh-tw', 'en'],
      預設語言: 預設語言 || 'zh-tw',
      資料庫,
      開始日期: body.開始日期 || now,
      結束日期: body.結束日期 || now,
      最後修改: now,
    });

    await info('DataGateway', `網站已建立：${網址}（${host}）`);

    // ── 4. 連接 L3 ──
    await getDbManager().initL3(host);
    const l3db = getDbManager().getL3(host);
    if (!l3db) {
      return c.json({
        success: true,
        data: { id },
        warning: '網站記錄已儲存，但 L3 連線失敗，無法自動建立管理員帳號',
      });
    }

    // ── 5. 建立管理員帳號 ──
    await l3db.initialize('使用者');

    const bcryptModule = (await import('bcryptjs')) as any;
    const hashFn = bcryptModule.default?.hash || bcryptModule.hash;
    const 密碼雜湊 = await hashFn(管理員密碼, 10);
    const 管理員ID = `使用者:使用者:${管理員帳號}`;

    await l3db.create('使用者', 管理員ID, {
      帳號: 管理員帳號,
      密碼雜湊,
      角色: ['使用者:角色:管理員'],
    });

    await info('DataGateway', `管理員 ${管理員帳號} 已建立於 ${host} 的 L3`);

    return c.json({ success: true, data: { id } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `申請失敗：${msg}` }, 500);
  }
};
