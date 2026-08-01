// Config Service — per-instance configuration + crypto key lifecycle
//
// Manages the ConfigStore (JSON KV backed by @dui/util) for this data-gateway.
// Crypto key is auto-generated on first run and stored in ConfigStore.

import { ConfigStore, registerKey, info } from '@dui/util';

let store: ConfigStore;

export async function initConfig(dataDir: string): Promise<ConfigStore> {
  store = new ConfigStore(`${dataDir}/config.json`);
  await store.init();

  // Crypto key: generate once, persist forever
  let cryptoKey = await store.get('_crypto_key');
  if (!cryptoKey) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    cryptoKey = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    await store.set('_crypto_key', cryptoKey);
    await info('Config', 'Crypto key auto-generated');
  }
  registerKey(cryptoKey);

  return store;
}

export function getConfig(): ConfigStore {
  return store;
}