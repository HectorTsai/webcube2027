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
  // 雙重保護機制：config.json + crypto.key 實體檔案
  let cryptoKey = await store.get('_crypto_key');

  if (!cryptoKey) {
    // config.json 遺失 — 嘗試從 crypto.key 實體檔案恢復
    const keyFilePath = `${dataDir}/crypto.key`;
    try {
      cryptoKey = await Deno.readTextFile(keyFilePath);
      cryptoKey = cryptoKey.trim();
      // 同步回 config.json
      await store.set('_crypto_key', cryptoKey);
      await info('Config', 'Crypto key recovered from crypto.key');
    } catch {
      // 兩邊都遺失 → 產生全新金鑰
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      cryptoKey = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      await store.set('_crypto_key', cryptoKey);
      // 同時寫入 crypto.key 實體檔案，作為備援
      try {
        await Deno.writeTextFile(keyFilePath, cryptoKey);
      } catch (err) {
        console.warn(
          `[Config] Failed to write crypto.key: ${err instanceof Error ? err.message : err}`,
        );
      }
      await info('Config', 'Crypto key auto-generated');
    }
  } else {
    // config.json 有 key — 確保 crypto.key 實體檔案也存在
    const keyFilePath = `${dataDir}/crypto.key`;
    try {
      await Deno.stat(keyFilePath);
    } catch {
      try {
        await Deno.writeTextFile(keyFilePath, cryptoKey);
        await info('Config', 'Crypto key backed up to crypto.key');
      } catch (err) {
        console.warn(
          `[Config] Failed to write crypto.key backup: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  registerKey(cryptoKey);

  return store;
}

export function getConfig(): ConfigStore {
  return store;
}