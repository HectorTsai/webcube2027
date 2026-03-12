// 簡單的 Deno KV 封裝，資料放在 data 目錄
// 提示：Deno KV 目前為 unstable API，執行時需 `deno run -A --unstable-kv` 或 Deno 1.42+ 默認允許。
import { 資料 } from "./index.ts";

function parseTypeFromId(id: string): string | null {
  const parts = id.split(":");
  if (parts.length < 2) return null;
  return parts[1]; // table:type:id 取出 type
}

async function loadModel(type: string): Promise<unknown> {
  // 動態載入對應模型，路徑相對於本檔案
  const mod = await import(`./models/${type}.ts`);
  return mod.default;
}

export class KV資料庫 {
  private kv: Deno.Kv | null = null;

  async 開啟(): Promise<void> {
    try {
      this.kv = await Deno.openKv("data/kv.sqlite3");
      console.log('[KV] 資料庫開啟成功');
    } catch (error) {
      console.error('[KV] 資料庫開啟失敗:', error);
      this.kv = null;
    }
  }

  async 取得資料<T extends 資料>(id: string): Promise<T | unknown | null> {
    if (!this.kv) {
      console.error('[KV] 資料庫未初始化');
      return null;
    }
    
    const res = await this.kv.get([id]);
    if (!res.value) return null;

    const type = parseTypeFromId(id);
    if (!type) return res.value;

    try {
      const Model = await loadModel(type) as any;
      const instance = new Model(res.value);
      return instance as T;
    } catch (_) {
      // 若載入模型失敗，回傳原始值
      return res.value;
    }
  }

  async 寫入資料(model: 資料): Promise<void> {
    if (!this.kv) {
      console.error('[KV] 資料庫未初始化');
      return;
    }
    await this.kv.set([model.id], model.toJSON());
  }

  async 個數(model: string): Promise<number> {
    if (!this.kv) {
      console.error('[KV] 資料庫未初始化');
      return 0;
    }
    
    const keys = this.kv.list({ prefix: [] });
    let count = 0;
    for await (const entry of keys) {
      const id = entry.key[0] as string;
      if (parseTypeFromId(id) === model) {
        count++;
      }
    }
    return count;
  }

  async 初始化(model: string): Promise<void> {
    if (!this.kv) {
      console.error('[KV] 資料庫未初始化，無法初始化模型');
      return;
    }
    
    const count = await this.個數(model);
    if (count === 0) {
      try {
        const seedPath = new URL(`./seeds/${model}.json`, import.meta.url);
        const seedData = JSON.parse(await Deno.readTextFile(seedPath));
        for (const item of seedData) {
          await this.kv.set([item.id], item);
        }
        console.log(`[KV] 模型 ${model} 初始化成功`);
      } catch (error) {
        console.error(`[KV] 模型 ${model} 初始化失敗:`, error);
      }
    }
  }
}
