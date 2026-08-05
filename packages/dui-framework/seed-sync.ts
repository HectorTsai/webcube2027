/**
 * seed-sync.ts — Seed 同步工具（@dui/framework 共用）
 *
 * 每個 Gateway 的種子資料皆位於自身的 database/seeds/ 目錄，依目標層級
 * 分為 L1/、L2/、L3/ 子目錄（視該 Gateway 需求，可只有其中若干層）。
 * 本模組提供統一的載入、版本比對與覆寫機制：
 *
 *  - loadSeeds()        — 讀取某層級的所有 seed 記錄
 *  - computeSeedsHash() — 以內容 hash（SHA-256）計算某層級的 seed 版本
 *  - syncSeeds()        — 版本不同時，依 collection:model 分組以批次 PUT（upsert）
 *                         覆寫至 data-gateway（每個分組一次 HTTP request）
 *  - syncAllSeeds()     — 自動偵測 seeds/ 下存在的層級，依序同步
 *
 * 版本 hash 存於各 Gateway 本機的持久化 KV（ConfigStore，由呼叫端傳入），
 * 因此每個 Gateway 各自記錄自己的 seed 已同步狀態；seed 檔案內容一變，
 * hash 即變，下次同步即自動覆寫，不再需要刪除資料庫重來。
 *
 * 只覆寫 seed 檔案中定義的記錄，不刪除資料庫中多餘的記錄，避免誤刪
 * 使用者自建的資料。
 */

import { info, error as logError } from '@dui/util';

/** 目標資料庫層級 */
export type SeedLevel = 'L1' | 'L2' | 'L3';

/** 存放 seed 版本 hash 的本機 KV 介面（ConfigStore 相容） */
export interface SeedKV {
  get(key: string): string | null | undefined | Promise<string | null | undefined>;
  set(key: string, value: string): void | Promise<void>;
}

export interface SyncSeedsOptions {
  /** database/seeds 目錄（絕對路徑字串或 file:// URL） */
  seedsRoot: string | URL;
  /** 本機持久化 KV（ConfigStore），存放 seed 版本 hash */
  store: SeedKV;
  /** data-gateway 服務 URL */
  baseUrl: string;
  /** data-gateway API Key（安裝時註冊取得） */
  apiKey: string;
  /** 目標層級 */
  level: SeedLevel;
  /** L3 專用：租戶 host（作為 X-Tenant header） */
  tenant?: string;
  /** 記錄送出前的轉換鉤子（如以 Model 補齊預設值），預設原樣送出 */
  prepare?: (
    record: Record<string, unknown>,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

export interface SyncSeedsResult {
  /** 目標層級 */
  level: SeedLevel;
  /** 此層 seed 內容 hash */
  hash: string;
  /** 是否需要同步（hash 與上次不同） */
  changed: boolean;
  /** 成功覆寫的筆數 */
  updated: number;
  /** 失敗筆數 */
  failed: number;
  /** 失敗原因列表 */
  errors: string[];
}

/** seed 版本 hash 的 KV key（每層獨立） */
export function seedHashKey(level: SeedLevel): string {
  return `seed_hash_${level}`;
}

function toDirUrl(seedsRoot: string | URL): URL {
  if (seedsRoot instanceof URL) {
    return seedsRoot.href.endsWith('/') ? seedsRoot : new URL(seedsRoot.href + '/');
  }
  const path = seedsRoot.replace(/\/+$/, '') + '/';
  return new URL(path.startsWith('/') ? path : `/${path}`, 'file:///');
}

function levelDirUrl(seedsRoot: string | URL, level: SeedLevel): URL {
  return new URL(`${level}/`, toDirUrl(seedsRoot));
}

function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}

/** 列出某層級下所有 JSON seed 檔案的相對路徑（排序後），目錄不存在時回傳 [] */
async function listSeedFiles(seedsRoot: string | URL, level: SeedLevel): Promise<string[]> {
  const dirUrl = levelDirUrl(seedsRoot, level);
  try {
    await Deno.stat(dirUrl);
  } catch {
    return [];
  }

  const files: string[] = [];
  for await (const entry of Deno.readDir(dirUrl)) {
    if (!entry.isDirectory) continue;
    const subDirUrl = new URL(entry.name + '/', dirUrl);
    for await (const file of Deno.readDir(subDirUrl)) {
      if (file.isFile && file.name.endsWith('.json')) {
        files.push(`${entry.name}/${file.name}`);
      }
    }
  }
  files.sort();
  return files;
}

/** 以內容 hash（SHA-256）計算某層級 seed 的版本；目錄不存在時回傳空字串 */
export async function computeSeedsHash(seedsRoot: string | URL, level: SeedLevel): Promise<string> {
  const files = await listSeedFiles(seedsRoot, level);
  if (files.length === 0) return '';

  const encoder = new TextEncoder();
  const dirUrl = levelDirUrl(seedsRoot, level);
  const parts: Uint8Array[] = [];
  for (const rel of files) {
    const text = await Deno.readTextFile(new URL(rel, dirUrl));
    parts.push(encoder.encode(`${rel}\n${text}\n`));
  }
  const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    joined.set(p, offset);
    offset += p.length;
  }
  const digest = await crypto.subtle.digest('SHA-256', joined);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 讀取某層級的所有 seed 記錄。
 * 目錄結構：seeds/<LEVEL>/<collection>/*.json（單層子目錄即 collection）。
 * 單一檔案可為單筆物件或物件陣列。
 */
export async function loadSeeds(
  seedsRoot: string | URL,
  level: SeedLevel,
): Promise<Record<string, unknown>[]> {
  const dirUrl = levelDirUrl(seedsRoot, level);
  try {
    await Deno.stat(dirUrl);
  } catch {
    return [];
  }

  const results: Record<string, unknown>[] = [];
  for await (const entry of Deno.readDir(dirUrl)) {
    if (!entry.isDirectory) continue;
    const subDirUrl = new URL(entry.name + '/', dirUrl);
    for await (const file of Deno.readDir(subDirUrl)) {
      if (!file.isFile || !file.name.endsWith('.json')) continue;
      try {
        const text = await Deno.readTextFile(new URL(file.name, subDirUrl));
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          results.push(...data);
        } else {
          results.push(data);
        }
      } catch {
        // 跳過無法讀取或解析的檔案
        continue;
      }
    }
  }
  return results;
}

/** 單次批次 PUT 的上限（與 data-gateway 的 MAX_BATCH_SIZE 一致） */
const BATCH_CHUNK = 100;

/** 將陣列切成不超過 size 的多個區塊 */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * 同步單一層級的 seed：
 * 1. 計算本地 seed 內容 hash
 * 2. 與本機 KV 中記錄的 hash 比對，相同則跳過
 * 3. 不同則依 collection:model 分組，以批次 PUT（upsert）覆寫至 data-gateway
 * 4. 全部成功才更新本機 hash（部分失敗保留舊版本，下次啟動重試）
 */
export async function syncSeeds(opts: SyncSeedsOptions): Promise<SyncSeedsResult> {
  const { seedsRoot, store, baseUrl, apiKey, level, tenant, prepare } = opts;

  const hash = await computeSeedsHash(seedsRoot, level);
  const key = seedHashKey(level);
  const stored = await store.get(key);

  const result: SyncSeedsResult = { level, hash, changed: false, updated: 0, failed: 0, errors: [] };

  // 版本相同（含兩者皆空）→ 不需要同步
  if (stored === hash) return result;

  result.changed = true;
  const records = await loadSeeds(seedsRoot, level);

  // 目錄存在但沒有任何記錄：直接記錄 hash，避免每次啟動重複掃描
  if (records.length === 0) {
    await store.set(key, hash);
    return result;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };
  if (tenant) headers['X-Tenant'] = tenant;

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  // 依 collection:model 分組，讓同組記錄共用一次批次 PUT
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const record of records) {
    const id = record.id as string;
    if (!isValidCompositeId(id)) {
      result.failed++;
      result.errors.push(`跳過無效 id：${id}`);
      await logError('SeedSync', `[seed ${level}] 跳過無效 id：${id}`);
      continue;
    }
    const [collection, model] = id.split(':');
    const groupKey = `${collection}:${model}`;
    const arr = groups.get(groupKey) ?? [];
    arr.push(record);
    groups.set(groupKey, arr);
  }

  for (const [groupKey, groupRecords] of groups) {
    const [collection, model] = groupKey.split(':');
    const url = `${cleanBaseUrl}/api/${level.toLowerCase()}/${collection}/${model}`;

    for (const chunkRecords of chunk(groupRecords, BATCH_CHUNK)) {
      try {
        const payload = prepare
          ? await Promise.all(chunkRecords.map((r) => prepare(r)))
          : chunkRecords;
        const r = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) });
        const res = await r.json().catch(() => ({}));
        if (r.ok || res.success) {
          const okSet = new Set<string>(res.data?.成功 ?? []);
          const failMap: Record<string, string> = res.data?.失敗原因 ?? {};
          for (const rec of chunkRecords) {
            const id = rec.id as string;
            if (okSet.has(id)) {
              result.updated++;
              await info('SeedSync', `[seed ${level}] 已覆寫：${id}`);
            } else {
              result.failed++;
              const msg = failMap[id] || '批次中未回報';
              result.errors.push(`${id}: ${msg}`);
              await logError('SeedSync', `[seed ${level}] 覆寫失敗 ${id}：${msg}`);
            }
          }
        } else {
          // 整批失敗（如權限不足、格式錯誤）
          result.failed += chunkRecords.length;
          const msg = res.error || r.statusText || '未知錯誤';
          for (const rec of chunkRecords) {
            result.errors.push(`${rec.id}: ${msg}`);
          }
          await logError('SeedSync', `[seed ${level}] 批次覆寫失敗 ${groupKey}：${msg}`);
        }
      } catch (err) {
        result.failed += chunkRecords.length;
        const msg = err instanceof Error ? err.message : String(err);
        for (const rec of chunkRecords) {
          result.errors.push(`${rec.id}: ${msg}`);
        }
        await logError('SeedSync', `[seed ${level}] 批次覆寫例外 ${groupKey}：${msg}`);
      }
    }
  }

  // 全部成功才更新版本，避免部分失敗後下次啟動不重試
  if (result.failed === 0) {
    await store.set(key, hash);
    await info('SeedSync', `[seed ${level}] 同步完成（${result.updated} 筆），版本已更新`);
  } else {
    await logError('SeedSync', `[seed ${level}] 同步失敗 ${result.failed} 筆，保留舊版本待下次重試`);
  }

  return result;
}

/** 偵測 seeds/ 下實際存在的層級目錄 */
export async function detectSeedLevels(seedsRoot: string | URL): Promise<SeedLevel[]> {
  const dirUrl = toDirUrl(seedsRoot);
  try {
    await Deno.stat(dirUrl);
  } catch {
    return [];
  }

  const found: SeedLevel[] = [];
  for await (const entry of Deno.readDir(dirUrl)) {
    if (entry.isDirectory && (entry.name === 'L1' || entry.name === 'L2' || entry.name === 'L3')) {
      found.push(entry.name as SeedLevel);
    }
  }
  return found;
}

/**
 * 同步所有存在的層級（L1/L2/L3）。
 * 未指定 levels 時，自動偵測 seeds/ 下實際存在的層級目錄。
 * L3 需透過 tenant 指定租戶（seed 屬租戶資料時才使用）。
 */
export async function syncAllSeeds(
  opts: Omit<SyncSeedsOptions, 'level'> & { levels?: SeedLevel[] },
): Promise<SyncSeedsResult[]> {
  const { seedsRoot, levels, ...rest } = opts;
  const targetLevels = levels ?? await detectSeedLevels(seedsRoot);

  const results: SyncSeedsResult[] = [];
  for (const level of targetLevels) {
    results.push(await syncSeeds({ ...rest, seedsRoot, level }));
  }
  return results;
}
