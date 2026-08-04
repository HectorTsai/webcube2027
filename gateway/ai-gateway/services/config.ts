// Config Service — per-instance configuration for ai-gateway
//
// Uses ConfigStore from @dui/util (persistent JSON KV).
// Replaces the old L1 (data/l1.json) approach.

import { ConfigStore } from '@dui/util';

let _config: ConfigStore | null = null;

export async function initAiConfig(dataDir: string): Promise<ConfigStore> {
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
  throw new Error('data-gateway URL 尚未設定。請設定 DATA_GATEWAY_URL 環境變數，或於 config.json 寫入 data_gateway_url。');
}
