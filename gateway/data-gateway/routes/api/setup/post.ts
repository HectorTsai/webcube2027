/**
 * POST /api/setup
 * 首次安裝 — 設定 L2 連線與 Master Key
 * （角色/超管理者帳號由 auth-gateway setup 建立，此處不建立任何帳號）
 */

import type { Context } from 'hono';
import { getConfig } from '../../../services/config.ts';
import { getDbManager } from '../../../services/db-manager.ts';
import { info, error as logError, encrypt } from '@dui/util';

export async function POST(c: Context) {
  try {
    const body = await c.req.json();
    const { l2, master_key } = body;

    if (!l2 || !l2.type) {
      return c.json({ success: false, error: '請提供有效的 L2 資料庫設定' }, 400);
    }

    // 檢查是否已安裝（防止重複覆蓋）
    const existingL2 = await getConfig().get('l2_connection');
    if (existingL2) {
      return c.json({ success: false, error: '系統已安裝，無法重複安裝' }, 400);
    }

    // ── 0. 驗證 Master Key ──
    if (!master_key || typeof master_key !== 'string') {
      return c.json({ success: false, error: '請提供 Master Key（用於其他 Gateway 註冊）' }, 400);
    }
    if (master_key.length < 8) {
      return c.json({ success: false, error: 'Master Key 長度至少 8 個字元' }, 400);
    }

    // ── 1. 處理 L2 連線設定 ──

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

    // ── 2. 儲存 Master Key（加密後存入 ConfigStore） ──
    const encryptedMasterKey = await encrypt(master_key);
    await getConfig().set('master_key', encryptedMasterKey);
    await info('DataGateway', 'Master Key 已設定並加密儲存');

    // ── 3. 儲存 L2 連線設定至 L1 ──
    l2.enabled = true;
    const encryptedL2 = await encrypt(JSON.stringify(l2));
    await getConfig().set('l2_connection', encryptedL2);

    // ── 4. 初始化 L2 ──
    await getDbManager().initL2();
    const system = getDbManager().System;
    if (!system) {
      return c.json({ success: false, error: 'L2 資料庫連線失敗，請檢查資料庫設定' }, 500);
    }
    await system.initialize('使用者');

    // 角色/使用者 seed 與超管理者帳號由 auth-gateway setup 建立，
    // 透過本 gateway 的 L1/L2 CRUD API（X-API-Key）寫入，此處不建立任何帳號。

    await info('DataGateway', '安裝完成');
    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('DataGateway', `安裝失敗：${msg}`);
    return c.json({ success: false, error: `安裝失敗：${msg}` }, 500);
  }
}