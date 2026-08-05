// Config Service — per-instance configuration for auth-gateway
//
// Uses ConfigStore from @dui/util (persistent JSON KV).
// Replaces the old utils/l1.ts that used @dui/kv L1Store.

import { ConfigStore } from '@dui/util';

let _config: ConfigStore | null = null;

export async function initAuthConfig(dataDir: string): Promise<ConfigStore> {
  const store = new ConfigStore(`${dataDir}/config.json`);
  await store.init();
  _config = store;
  return store;
}

export function getConfig(): ConfigStore {
  if (!_config) throw new Error('ConfigStore 尚未初始化');
  return _config;
}

/** 取得 data-gateway URL，依序：ConfigStore → env var；兩者皆無則回傳 null */
export async function getDataGatewayUrl(): Promise<string | null> {
  try {
    const stored = await _config?.get('data_gateway_url');
    if (stored) return stored;
  } catch { /* not ready */ }
  return Deno.env.get('DATA_GATEWAY_URL') || null;
}

/** 取得 data-gateway API Key（安裝時註冊取得） */
export async function getDataGatewayApiKey(): Promise<string | null> {
  try {
    return (await _config?.get('data_gateway_api_key')) ?? null;
  } catch {
    return null;
  }
}

/** 檢查 auth-gateway 是否已完成安裝 */
export async function isInstalled(): Promise<boolean> {
  try {
    const url = await _config?.get('data_gateway_url');
    return !!url;
  } catch {
    return false;
  }
}