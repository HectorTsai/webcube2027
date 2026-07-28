/**
 * POST /api/setup
 * 首次安裝 — 設定 L2 連線、auth-gateway URL、建立預設角色與管理員
 */

import type { Context } from 'hono';
import { dataPool } from '@dui/database';
import { info, error as logError, encrypt } from '@dui/util';
import { loadSeedsRecursive } from '../../../database/seed-loader.ts';

export async function POST(c: Context) {
  try {
    const body = await c.req.json();
    const { 管理員帳號, 管理員密碼, l2, auth_gateway_url } = body;

    // ── 0. 基礎參數校驗 ──
    if (!管理員帳號 || !管理員密碼) {
      return c.json({ success: false, error: '請填寫管理員帳號與密碼' }, 400);
    }

    if (!l2 || !l2.type) {
      return c.json({ success: false, error: '請提供有效的 L2 資料庫設定' }, 400);
    }

    if (!dataPool.config) {
      return c.json({ success: false, error: 'L1 設定資料庫未就緒' }, 500);
    }

    // 檢查是否已安裝（防止重複覆蓋）
    const existingL2 = await dataPool.config.get('l2_connection');
    if (existingL2) {
      return c.json({ success: false, error: '系統已安裝，無法重複安裝' }, 400);
    }

    // ── 1. 驗證 auth-gateway URL 格式 ──
    if (auth_gateway_url) {
      try {
        new URL(auth_gateway_url);
      } catch {
        return c.json({ success: false, error: 'auth-gateway URL 格式不正確' }, 400);
      }
    }

    // ── 2. 處理 L2 連線設定 ──

    // Firestore：驗證上傳的服務帳號金鑰 JSON
    if (l2.type === 'firestore') {
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
    if (l2.type === 'sqlite' && l2.filePath) {
      const fileDir = import.meta.dirname;
      const dataDir = fileDir ? `${fileDir}/../../../data` : './data';
      l2.filePath = `${dataDir}/${l2.filePath.split('/').pop() || 'l2.db'}`;
    }

    // ── 3. 儲存設定至 L1 ──
    if (auth_gateway_url) {
      await dataPool.config.set('auth_gateway_url', auth_gateway_url);
      await info('DataGateway', `auth-gateway URL 已設定：${auth_gateway_url}`);
    }

    l2.enabled = true;
    const encryptedL2 = await encrypt(JSON.stringify(l2));
    await dataPool.config.set('l2_connection', encryptedL2);

    // ── 4. 初始化 L2 ──
    await dataPool.initL2();
    const system = dataPool.System;
    if (!system) {
      return c.json({ success: false, error: 'L2 資料庫連線失敗，請檢查資料庫設定' }, 500);
    }
    await system.initialize('使用者');

    // 從 seed 載入 L2 下所有預設資料（角色、使用者等）
    // 自動掃描 L2/ 下每個子目錄，未來新增分類只需加目錄 + JSON 檔案
    const seeds = await loadSeedsRecursive('L2');
    for (const item of seeds) {
      try {
        const { id, ...data } = item;
        await system.create('使用者', id as string, data);
      } catch {
        // 若已存在則忽略
      }
    }

    // 建立超級管理員（相容不同 module 載入情境）
    const bcryptModule = (await import('bcryptjs')) as any;
    const hashFn = bcryptModule.default?.hash || bcryptModule.hash;
    const 密碼雜湊 = await hashFn(管理員密碼, 10);
    const 管理員ID = `使用者:使用者:${管理員帳號}`;
    await system.create('使用者', 管理員ID, {
      帳號: 管理員帳號,
      密碼雜湊,
      角色: ['使用者:角色:超級管理員'],
    });

    await info('DataGateway', '安裝完成');
    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('DataGateway', `安裝失敗：${msg}`);
    return c.json({ success: false, error: `安裝失敗：${msg}` }, 500);
  }
}