// Config Store — simple persistent key-value store backed by a JSON file
//
// Stores per-instance configuration (crypto key, connection strings, URLs, etc.)
// in a local JSON file. All data is cached in memory for fast reads.
// Writes use atomic temp-file + rename pattern to prevent corruption.
//
// This is NOT a database — it is a lightweight config utility for gateway
// instances. Use a real database (via @dui/database) for structured data.

import { info, debug, error } from './common/logger.ts';
import { dirname, resolve } from '@std/path';

const DEFAULT_DATA_PATH = './data/config.json';

/**
 * Simple persistent key-value store backed by a JSON file.
 *
 * All data is cached in memory for fast reads. Writes flush to disk
 * via a single background task with dirty-flag coalescing, using an
 * atomic temp-file + rename pattern to prevent file corruption.
 *
 * Designed for per-instance configuration only (crypto keys, URLs, etc).
 * Not suitable for large or structured datasets.
 */
export class ConfigStore {
  private dataPath: string;
  private cache = new Map<string, string>();
  private isDirty = false;
  private flushingTask: Promise<void> | null = null;

  constructor(dataPath?: string) {
    const rawPath = dataPath || Deno.env.get('CONFIG_PATH') || DEFAULT_DATA_PATH;
    this.dataPath = resolve(rawPath);
  }

  /** Initialize the store — ensures the data directory and loads existing data. */
  async init(): Promise<void> {
    await this.ensureDir();
    await this.load();
    await info('Config', `Store ready (${this.dataPath}, ${this.cache.size} keys)`);
  }

  /** Get a value by key. Returns `null` if the key does not exist. */
  async get(key: string): Promise<string | null> {
    return this.cache.get(key) ?? null;
  }

  /** Set a value by key. Persists to disk asynchronously with coalescing. */
  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    await this.flush();
    await debug('Config', `Set "${key}"`);
  }

  /** Delete a key. Persists to disk asynchronously with coalescing. */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.flush();
    await debug('Config', `Deleted "${key}"`);
  }

  /** Check if a key exists. */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /** Get all keys. */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /** Export all data as a plain object (for backup / admin UI). */
  exportAll(): Record<string, string> {
    return Object.fromEntries(this.cache);
  }

  // ── Internal ──

  private async ensureDir(): Promise<void> {
    const dir = dirname(this.dataPath);
    if (!dir || dir === '.') return;
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) throw err;
    }
  }

  private async load(): Promise<void> {
    let text: string;
    try {
      text = await Deno.readTextFile(this.dataPath);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        // 檔案不存在 — 首次啟動，使用空快取
        this.cache.clear();
        return;
      }
      throw err;
    }

    // 檔案存在但 JSON 無效 → 明確報錯，避免設定（含 JWT 金鑰）被誤當成「未設定」而重生
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await error('Config', `Config 檔案損壞，拒絕載入：${this.dataPath} (${detail})`);
      throw new Error(`Config 檔案無效（${this.dataPath}）：${detail}`);
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') this.cache.set(k, v);
      }
    }
  }

  /**
   * Dirty-flag coalescing flush. Multiple concurrent calls share a single
   * background task that keeps flushing until the cache is clean.
   */
  private async flush(): Promise<void> {
    this.isDirty = true;
    if (this.flushingTask) return this.flushingTask;

    this.flushingTask = (async () => {
      while (this.isDirty) {
        this.isDirty = false;
        const snapshot = Object.fromEntries(this.cache);
        try {
          await this.atomicWrite(snapshot);
        } catch (err) {
          this.isDirty = true;
          await error('Config', `Flush failed: ${err}`);
          break;
        }
      }
    })().finally(() => {
      this.flushingTask = null;
    });

    return this.flushingTask;
  }

  /** Atomic write: write to a uniquely-named temp file, then rename. */
  private async atomicWrite(data: Record<string, string>): Promise<void> {
    const suffix = `${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    const tmpPath = `${this.dataPath}.${suffix}.tmp`;
    await Deno.writeTextFile(tmpPath, JSON.stringify(data, null, 2));
    await Deno.rename(tmpPath, this.dataPath);
  }
}