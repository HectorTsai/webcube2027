// Config Service — per-instance configuration for site-gateway
//
// Uses ConfigStore from @dui/util (persistent JSON KV).

import { ConfigStore } from '@dui/util';

let _config: ConfigStore | null = null;

export async function initSiteConfig(dataDir: string): Promise<ConfigStore> {
  const store = new ConfigStore(`${dataDir}/config.json`);
  await store.init();
  _config = store;
  return store;
}

export function getConfig(): ConfigStore {
  if (!_config) throw new Error('ConfigStore 尚未初始化');
  return _config;
}

/** 取得 data-gateway URL，依序：ConfigStore → env var */
export async function getDataGatewayUrl(): Promise<string> {
  try {
    const stored = await _config?.get('data_gateway_url');
    if (stored) return stored;
  } catch { /* not ready */ }
  const envUrl = Deno.env.get('DATA_GATEWAY_URL');
  if (envUrl) return envUrl;
  throw new Error('data-gateway URL 尚未設定。請先完成安裝或設定 DATA_GATEWAY_URL 環境變數。');
}

/** 取得 data-gateway API Key（安裝時註冊取得） */
export async function getDataGatewayApiKey(): Promise<string | null> {
  try {
    return (await _config?.get('data_gateway_api_key')) ?? null;
  } catch {
    return null;
  }
}

/** 取得 auth-gateway URL，依序：ConfigStore → env var */
export async function getAuthGatewayUrl(): Promise<string> {
  try {
    const stored = await _config?.get('auth_gateway_url');
    if (stored) return stored;
  } catch { /* not ready */ }
  const envUrl = Deno.env.get('AUTH_GATEWAY_URL');
  if (envUrl) return envUrl;
  throw new Error('auth-gateway URL 尚未設定。請先完成安裝或設定 AUTH_GATEWAY_URL 環境變數。');
}

/** 檢查 site-gateway 是否已完成安裝（需同時有 auth_gw_url + data_gw_url） */
export async function isInstalled(): Promise<boolean> {
  try {
    const authUrl = await _config?.get('auth_gateway_url');
    const dataUrl = await _config?.get('data_gateway_url');
    return !!authUrl && !!dataUrl;
  } catch {
    return false;
  }
}