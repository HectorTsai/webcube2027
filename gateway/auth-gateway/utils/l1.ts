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