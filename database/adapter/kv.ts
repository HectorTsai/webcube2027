// KV Adapter — 實作 DatabaseAdapter，作為三層架構的 L1 層

import { DatabaseAdapter, 查詢選項, 欄位篩選 } from './adapter-interface.ts';

export class KVAdapter implements DatabaseAdapter {
  readonly 類型 = 'kv';
  private kv: Deno.Kv;

  constructor(kv: Deno.Kv) {
    this.kv = kv;
  }

  /** 暴露原始 Deno.Kv 供低層操作（快取、排程） */
  取得原始KV(): Deno.Kv {
    return this.kv;
  }

  // ── 查詢 ──

  async 查詢單一(模型: string, id: string): Promise<Record<string, unknown> | null> {
    const table = id.split(':')[0];
    const result = await this.kv.get<Record<string, unknown>>([table, id]);
    if (!result.value) return null;
    return this.處理SecretString(模型, result.value);
  }

  async 查詢列表(模型: string, 選項: 查詢選項 = {}): Promise<Record<string, unknown>[]> {
    const limit = 選項.limit ?? 50;
    const offset = 選項.offset ?? 0;
    const items: Record<string, unknown>[] = [];

    for await (const entry of this.kv.list<Record<string, unknown>>({ prefix: [模型] })) {
      if (entry.value) {
        items.push(this.處理SecretString(模型, entry.value));
      }
    }

    // 依最後修改降冪排序
    items.sort((a, b) => {
      const aTime = (a.最後修改 as string) ?? '';
      const bTime = (b.最後修改 as string) ?? '';
      return bTime.localeCompare(aTime);
    });

    return items.slice(offset, offset + limit);
  }

  /** KV 不支援欄位索引查詢，一律回傳空 */
  查詢依欄位(_模型: string, _篩選: 欄位篩選): Promise<Record<string, unknown>[]> {
    return Promise.resolve([]);
  }

  // ── 寫入 ──

  async 創建(_模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, id };
    const table = id.split(':')[0];
    await this.kv.set([table, id], dataWithId);
    return dataWithId;
  }

  async 更新(_模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const existing = await this.查詢單一(_模型, id);
    const merged = { ...existing, ...資料, id };
    const table = id.split(':')[0];
    await this.kv.set([table, id], merged);
    return merged;
  }

  async 刪除(_模型: string, id: string): Promise<boolean> {
    try {
      const table = id.split(':')[0];
      await this.kv.delete([table, id]);
      return true;
    } catch {
      return false;
    }
  }

  async 個數(模型: string): Promise<number> {
    let count = 0;
    for await (const _ of this.kv.list({ prefix: [模型] })) {
      count++;
    }
    return count;
  }

  /** 檢查筆數，若為 0 則從種子檔案匯入 */
  async 初始化(模型: string): Promise<void> {
    const count = await this.個數(模型);
    if (count > 0) return;

    const { 讀取種子 } = await import('../index.ts');
    const items = await 讀取種子(模型);
    if (!items || items.length === 0) return;

    for (const 實例 of items) {
      try {
        await (實例 as { 初始化?: () => Promise<void> }).初始化?.();
        await this.創建(模型, (實例 as { id: string }).id, (實例 as { toJSON: () => Record<string, unknown> }).toJSON());
      } catch { /* skip */ }
    }
  }

  // ── 內部 ──

  /** 處理 SecretString 欄位 → 還原為純文字 */
  private 處理SecretString(模型: string, 資料: Record<string, unknown>): Record<string, unknown> {
    if (模型 !== '系統資訊') return 資料;

    const 資料庫 = 資料.資料庫;
    if (資料庫 && typeof 資料庫 === 'object') {
      const s = 資料庫 as Record<string, unknown>;
      if (s.ciphertext && typeof s.ciphertext === 'object') {
        const ct = s.ciphertext as Record<string, unknown>;
        if (ct.plaintext) {
          return { ...資料, 資料庫: ct.plaintext as string };
        }
      } else if (s.plaintext) {
        return { ...資料, 資料庫: s.plaintext as string };
      }
    }
    return 資料;
  }
}
