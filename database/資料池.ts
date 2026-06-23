// 資料池 — L1/L2/L3 統一資料入口
// 全域單例，所有服務直接 import 使用
//
// 路由規則：L3（指定 host）→ 其他 L3 → L2（SYSTEM）→ L1（BASE）純降級
// System getter：直接拿 L2 DatabaseAdapter 做後台操作
//
// 生命週期：
//   main.ts → await 資料池.初始化()
//     → 初始化L1()：連線 + 掃描 models/ 目錄自動 seed
//   middleware → await 資料池.初始化L2() → L2 連線
//   middleware → await 資料池.初始化L3(host) → L3 連線

import 排程記錄 from './models/排程記錄.ts';
import { 定時器, type 排程資料庫 } from '../services/scheduler/index.ts';
import { DatabaseAdapter } from './adapter/adapter-interface.ts';
import { L2連線資訊 } from './index.ts';
import { info, error } from '../utils/logger.ts';

// ── 查詢結果 ──

type 來源層級 = 'L1' | 'L2' | 'L3';

export interface 查詢結果<T> {
  data: T | null;
  source: 來源層級;
  success: boolean;
  error?: string;
}

// ── 資料池核心 ──

class 資料池核心 {
  /** L1="BASE", L2="SYSTEM", L3=host */
  private 連線池 = new Map<string, DatabaseAdapter>();
  private 初始化中 = { L2: false, L3: new Set<string>() };

  // ═══════════════════════════════════════════
  //  生命週期
  // ═══════════════════════════════════════════

  async 初始化(): Promise<void> {
    if (this.連線池.has('BASE')) return;
    await this.初始化L1();

    // ── 啟動定時器 ──
    setTimeout(() => this.啟動定時器(), 5000);
  }

  /** 掃描 database/models/*.ts 動態取得 model 清單 */
  private async 掃描Models(): Promise<string[]> {
    const models: string[] = [];
    const dir = new URL('./models/', import.meta.url);
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.endsWith('.ts')) {
        models.push(entry.name.replace(/\.ts$/, ''));
      }
    }
    return models;
  }

  private async 初始化L1(): Promise<void> {
    const 路徑 = Deno.env.get('L1_DB_PATH') || './data/webcube.db';

    const { SqliteAdapter } = await import('./adapter/sqlite.ts');
    const l1 = new SqliteAdapter(路徑);
    await info('資料池', `L1 連線成功 — SQLite (${路徑})`);

    this.連線池.set('BASE', l1);

    // ── L1 seed：動態掃描 models/ 目錄全部初始化 ──
    const models = await this.掃描Models();
    for (const m of models) {
      try { await l1.初始化(m); } catch (e) { await error('資料池', `L1 seed 失敗: ${m} — ${e}`); }
    }
    await info('資料池', `L1 種子載入完成 (${models.length} 個 model)`);
  }

  async 初始化L2(): Promise<void> {
    if (this.連線池.has('SYSTEM')) return;

    if (this.初始化中.L2) {
      while (this.初始化中.L2) await new Promise(r => setTimeout(r, 100));
      return;
    }

    this.初始化中.L2 = true;
    try {
      const l1 = this.連線池.get('BASE')!;
      const l2Info = await this.讀取L2連線資訊(l1);
      if (!l2Info) { this.初始化中.L2 = false; return; }

      const l2 = await this.建立Adapter(l2Info);
      if (!l2) { this.初始化中.L2 = false; return; }

      this.連線池.set('SYSTEM', l2);
      await info('資料池', 'L2 連線成功');
    } finally {
      this.初始化中.L2 = false;
    }
  }

  async 初始化L3(host: string): Promise<void> {
    if (this.連線池.has(host)) return;

    if (this.初始化中.L3.has(host)) {
      while (this.初始化中.L3.has(host)) await new Promise(r => setTimeout(r, 100));
      return;
    }

    this.初始化中.L3.add(host);
    try {
      const l2 = this.連線池.get('SYSTEM');
      if (!l2) { this.初始化中.L3.delete(host); return; }

      const rows = await l2.查詢依欄位('網站資訊', { 欄位: '網域', 值: host });
      const 網站資料 = rows[0];
      if (!網站資料) { this.初始化中.L3.delete(host); return; }

      let 連線: L2連線資訊 | null = null;
      if (網站資料.資料庫連線) {
        try { 連線 = JSON.parse(網站資料.資料庫連線 as string) as L2連線資訊; } catch { /* skip */ }
      }
      if (!連線) { this.初始化中.L3.delete(host); return; }

      const l3 = await this.建立Adapter(連線);
      if (l3) {
        this.連線池.set(host, l3);
        await info('資料池', `L3 連線成功 (${host})`);
      }
    } finally {
      this.初始化中.L3.delete(host);
    }
  }

  // ═══════════════════════════════════════════
  //  對外查詢 API（L3 → L2 → L1 純降級）
  // ═══════════════════════════════════════════

  async 查詢單一<T extends { id: string }>(id: string, host?: string): Promise<查詢結果<T>> {
    const model = this.解析Model(id);
    if (!model) return { data: null, source: 'L1', success: false, error: 'ID 格式錯誤' };

    for (const key of this.路由層級(host)) {
      const db = this.連線池.get(key)!;
      try {
        const raw = await db.查詢單一(model, id);
        if (raw) {
          const 實例 = await this.轉換為模型實例<T>(raw);
          if (實例) return { data: 實例, source: this.keyTo層級(key), success: true };
        }
      } catch { /* 降級至下個層級 */ }
    }

    return { data: null, source: 'L1', success: false, error: '所有可用層級都無此資料' };
  }

  async 查詢列表<T extends { id: string }>(
    model: string,
    limit: number = 50,
    offset: number = 0,
    host?: string
  ): Promise<查詢結果<T[]>> {
    for (const key of this.路由層級(host)) {
      const db = this.連線池.get(key)!;
      try {
        const rows = await db.查詢列表(model, { limit, offset });
        if (rows.length > 0) {
          const 結果: T[] = [];
          for (const row of rows) {
            const 實例 = await this.轉換為模型實例<T>(model, row);
            if (實例) 結果.push(實例);
          }
          return { data: 結果, source: this.keyTo層級(key), success: true };
        }
      } catch { /* 降級 */ }
    }

    return { data: [], source: 'L1', success: true };
  }

  /** 合併所有層級（去重，高層級優先）*/
  async 查詢所有列表<T extends { id: string }>(
    model: string,
    limit: number = 50,
    offset: number = 0,
    host?: string
  ): Promise<查詢結果<T[]>> {
    const 所有資料: T[] = [];
    const seen = new Set<string>();

    for (const key of this.路由層級(host)) {
      const db = this.連線池.get(key)!;
      try {
        const rows = await db.查詢列表(model, { limit, offset });
        for (const row of rows) {
          const rid = row.id as string;
          if (seen.has(rid)) continue;
          seen.add(rid);
          const 實例 = await this.轉換為模型實例<T>(model, row);
          if (實例) 所有資料.push(實例);
        }
      } catch { /* skip failed layer */ }
    }

    return { data: 所有資料, source: 'L1', success: true };
  }

  /** 取得預設值：永遠從 L1 seed 拿 */
  async 取得預設值<T extends { id: string }>(model: string): Promise<查詢結果<T>> {
    const db = this.連線池.get('BASE');
    if (!db) return { data: null, source: 'L1', success: false, error: 'L1 未初始化' };

    const rows = await db.查詢列表(model, { limit: 1 });
    if (rows.length > 0) {
      const 實例 = await this.轉換為模型實例<T>(model, rows[0]);
      if (實例) return { data: 實例, source: 'L1', success: true };
    }
    return { data: null, source: 'L1', success: false, error: '無預設資料' };
  }

  async 創建或更新<T extends { id?: string }>(
    model: string,
    資料: Partial<T>,
    host?: string
  ): Promise<查詢結果<T>> {
    const key = this.寫入層級(host);
    const db = this.連線池.get(key);
    if (!db) return { data: null, source: 'L1', success: false, error: '無可用的寫入資料庫' };

    const { id, isUpdate } = await this.處理ID(model, 資料);
    const 更新資料 = { ...資料, id } as Record<string, unknown>;

    try {
      // 更新模式下先確認該層級有沒有這筆
      if (isUpdate) {
        const existing = await db.查詢單一(model, id);
        if (!existing) {
          // 該層級沒有 → 走創建
          const created = await db.創建(model, id, 更新資料);
          if (created) {
            const 實例 = await this.轉換為模型實例<T>(created);
            if (實例) return { data: 實例, source: this.keyTo層級(key), success: true };
          }
        }
      }

      const result = isUpdate
        ? await db.更新(model, id, 更新資料)
        : await db.創建(model, id, 更新資料);
      if (result) {
        const 實例 = await this.轉換為模型實例<T>(result);
        if (實例) return { data: 實例, source: this.keyTo層級(key), success: true };
      }

      return { data: null, source: this.keyTo層級(key), success: false, error: '寫入失敗' };
    } catch (err) {
      return { data: null, source: this.keyTo層級(key), success: false, error: String(err) };
    }
  }

  async 刪除(id: string, host?: string): Promise<查詢結果<boolean>> {
    const model = this.解析Model(id);
    if (!model) return { data: false, source: 'L1', success: false, error: 'ID 格式錯誤' };

    // 檢查是否可刪除：先查詢現有資料
    const 現有 = await this.查詢單一(id, host);
    if (現有.success && (現有.data as any)?.可刪除 === false) {
      return { data: false, source: 現有.source, success: false, error: '此資料不可刪除（系統預設資料）' };
    }

    const key = this.寫入層級(host);
    const db = this.連線池.get(key);
    if (!db) return { data: false, source: 'L1', success: false, error: '無可用的寫入資料庫' };

    try {
      const ok = await db.刪除(model, id) as boolean;
      return { data: ok, source: this.keyTo層級(key), success: ok };
    } catch (err) {
      return { data: false, source: this.keyTo層級(key), success: false, error: String(err) };
    }
  }

  // ═══════════════════════════════════════════
  //  System getter — 直接拿 L2 adapter（後台系統設定用）
  // ═══════════════════════════════════════════

  get System(): DatabaseAdapter | null {
    return this.連線池.get('SYSTEM') ?? null;
  }

  // ═══════════════════════════════════════════
  //  內部：路由（純層級降級，無 model 過濾）
  // ═══════════════════════════════════════════

  /**
   * 回傳當前可用的層級 key 列表：指定 host L3 優先 → 其他 L3 → L2 → L1
   */
  private 路由層級(host?: string): string[] {
    const keys: string[] = [];

    // 指定 host 的 L3 優先
    if (host && this.連線池.has(host)) keys.push(host);

    // 其他 L3 host
    for (const k of this.連線池.keys()) {
      if (k !== 'BASE' && k !== 'SYSTEM' && k !== host) keys.push(k);
    }

    // L2
    if (this.連線池.has('SYSTEM')) keys.push('SYSTEM');

    // L1 always
    keys.push('BASE');

    return keys;
  }

  /**
   * 寫入目標層級：不降級，只回一個 key
   * host → L3, 無 host → L2, L2 無 → L1
   */
  private 寫入層級(host?: string): string {
    if (host && this.連線池.has(host)) return host;
    if (this.連線池.has('SYSTEM')) return 'SYSTEM';
    return 'BASE';
  }

  private keyTo層級(key: string): 來源層級 {
    if (key === 'SYSTEM') return 'L2';
    if (key === 'BASE') return 'L1';
    return 'L3';
  }

  private 解析Model(id: string): string | null {
    const parts = id.split(':');
    return parts.length >= 3 ? parts[1] : null;
  }

  // ═══════════════════════════════════════════
  //  內部：Adapter 工廠
  // ═══════════════════════════════════════════

  private async 建立Adapter(連線: L2連線資訊): Promise<DatabaseAdapter | null> {
    const 類型 = 連線.類型 || 'surrealdb';

    switch (類型) {
      case 'surrealdb': {
        const { SurrealAdapter } = await import('./adapter/surreal.ts');
        const adapter = new SurrealAdapter({
          url: `http://${連線.主機 || 'localhost'}:${連線.埠號 ?? 8000}`,
          database: 連線.資料庫名稱 || 'webcube',
          namespace: 連線.命名空間 || 'webcube',
          user: 連線.使用者名稱 || 'root',
          password: 連線.密碼 || 'root',
        });
        if (await adapter.登入()) return adapter;
        await error('資料池', 'SurrealDB 登入失敗');
        return null;
      }
      case 'sqlite': {
        const { SqliteAdapter } = await import('./adapter/sqlite.ts');
        return new SqliteAdapter(連線.檔案路徑 || 連線.資料庫名稱 || './data/l2.db');
      }
      case 'mongodb': {
        const { MongoAdapter } = await import('./adapter/mongodb.ts');
        const uri = `mongodb://${連線.使用者名稱 || ''}:${連線.密碼 || ''}@${連線.主機 || 'localhost'}:${連線.埠號 ?? 27017}`;
        return new MongoAdapter(uri, 連線.資料庫名稱 || 'webcube');
      }
      default:
        await error('資料池', `不支援的資料庫類型: ${類型}`);
        return null;
    }
  }

  private async 讀取L2連線資訊(l1: DatabaseAdapter): Promise<L2連線資訊 | null> {
    const raw = await l1.查詢單一('系統資訊', '系統資訊:系統資訊:預設');
    if (!raw) return null;

    const 連線字串 = (typeof raw.資料庫 === 'string') ? raw.資料庫 as string : '';
    if (!連線字串.trim()) return null;

    try { return JSON.parse(連線字串) as L2連線資訊; } catch { return null; }
  }

  // ═══════════════════════════════════════════
  //  內部：工具
  // ═══════════════════════════════════════════

  private async 處理ID<T extends { id?: string }>(
    model: string, 資料: Partial<T>
  ): Promise<{ id: string; isUpdate: boolean }> {
    if (!資料.id) {
      const { nanoid } = await import('nanoid');
      return { id: `${model}:${model}:${nanoid()}`, isUpdate: false };
    }

    const idParts = (資料.id as string).split(':');
    if (idParts.length === 3) {
      return { id: 資料.id as string, isUpdate: true };
    }

    const { nanoid } = await import('nanoid');
    const table = idParts[0];
    const m = idParts.length === 2 ? idParts[1] : table;
    return { id: `${table}:${m}:${nanoid()}`, isUpdate: false };
  }

  private async 轉換為模型實例<T>(
    modelOrData: string | Record<string, unknown>,
    原始資料?: Record<string, unknown>
  ): Promise<T | null> {
    try {
      let model: string;
      let data: Record<string, unknown>;

      if (typeof modelOrData === 'string') {
        model = modelOrData;
        data = 原始資料!;
      } else {
        data = modelOrData;
        const dataId = data.id as string;
        if (!dataId) return null;
        model = this.解析Model(dataId)!;
        if (!model) return null;
      }

      const 模型模組 = await import(`./models/${model}.ts`);
      const 模型類別 = 模型模組.default;
      if (!模型類別 || typeof 模型類別 !== 'function') return null;

      return new 模型類別(data, data.可刪除 || false) as T;
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════
  //  定時器
  // ═══════════════════════════════════════════

  private async 啟動定時器(): Promise<void> {
    const 排程db: 排程資料庫 = {
      讀取所有排程: async () => {
        const result = await this.查詢所有列表<排程記錄>('排程記錄', 1000, 0);
        return result.data ?? [];
      },
      更新最後執行: async (id, 時間) => {
        // 從所有排程中找這筆，用它的 host 決定寫入目標
        const all = await this.查詢所有列表<排程記錄>('排程記錄', 1000, 0);
        const record = (all.data ?? []).find(r => r.id === id);
        if (!record) return;
        // 先取完整序列化（避免 Adapter 全量替換時丟失其他欄位）
        const 完整資料 = record.toJSON();
        完整資料.最後執行 = 時間;
        await this.創建或更新('排程記錄', 完整資料, record.host ?? undefined);
      },
      刪除排程: async (id) => {
        const all = await this.查詢所有列表<排程記錄>('排程記錄', 1000, 0);
        const record = (all.data ?? []).find(r => r.id === id);
        await this.刪除(id, record?.host ?? undefined);
      },
    };
    await 定時器.排程(排程db);
    await info('資料池', '定時器已啟動');
  }

  // ═══════════════════════════════════════════
  //  清理
  // ═══════════════════════════════════════════

  關閉(): void {
    this.連線池.clear();
  }
}

// ── 全域單例 ──

export const 資料池 = new 資料池核心();
