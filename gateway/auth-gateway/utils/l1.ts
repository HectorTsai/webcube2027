/**
 * L1 共用實例 — 供 middleware 與 API handler 存取 L1 Store
 *
 * main.ts 在 createGateway() 後呼叫 setL1(gw.l1)，
 * middleware 與 handler 即可透過 getL1() 讀寫設定。
 */

import type { L1Store } from '@dui/kv';

let _l1: L1Store | null = null;

export function setL1(store: L1Store) {
  _l1 = store;
}

export function getL1(): L1Store {
  if (!_l1) throw new Error('L1 尚未初始化，請先呼叫 setL1()');
  return _l1;
}

/** 檢查 auth-gateway 是否已完成安裝（L1 中是否有 data_gateway_url） */
export async function isInstalled(): Promise<boolean> {
  const url = await _l1?.get('data_gateway_url');
  return !!url;
}

/**
 * 取得 data-gateway URL，依序嘗試：
 * 1. L1 設定（auth-gateway 安裝時儲存）
 * 2. DATA_GATEWAY_URL 環境變數
 */
export async function getDataGatewayUrl(): Promise<string> {
  try {
    const l1 = getL1();
    const stored = await l1.get('data_gateway_url');
    if (stored) return stored;
  } catch {
    // L1 尚未就緒
  }
  const envUrl = Deno.env.get('DATA_GATEWAY_URL');
  if (envUrl) return envUrl;
  throw new Error('data-gateway URL 尚未設定。請先完成安裝或設定 DATA_GATEWAY_URL 環境變數。');
}