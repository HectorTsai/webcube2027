// L1 Store — simple persistent key-value store backed by a JSON file
//
// L1 is a lightweight config store, NOT a full database. It stores system
// settings and the L2 connection info needed to bootstrap upper layers.
//
// Lifecycle:
//   const store = new L1Store();
//   await store.init();       // ensures data dir + loads cache
//   await store.get("key");   // returns string | null
//   await store.set("key", "value");
//   await store.delete("key");
//
// Sensitive values should be encrypted with encrypt() before storing.

import { info, debug } from './logger.ts';

const DEFAULT_DATA_PATH = './data/l1.json';

/**
 * Simple persistent key-value store backed by a JSON file.
 *
 * All data is cached in memory for fast reads. Writes flush to disk
 * immediately. The file is human-readable for debugging; sensitive
 * fields should be pre-encrypted by the caller.
 */
export class L1Store {
  private dataPath: string;
  private cache = new Map<string, string>();

  constructor(dataPath?: string) {
    this.dataPath = dataPath || Deno.env.get('L1_PATH') || DEFAULT_DATA_PATH;
  }

  /** Initialize the store — ensures the data directory and loads existing data. */
  async init(): Promise<void> {
    await this.ensureDir();
    await this.load();
    await info('L1', `Store ready (${this.dataPath}, ${this.cache.size} keys)`);
  }

  /** Get a value by key. Returns `null` if the key does not exist. */
  async get(key: string): Promise<string | null> {
    return this.cache.get(key) ?? null;
  }

  /** Set a value by key. Persists to disk immediately. */
  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    await this.flush();
    await debug('L1', `Set "${key}"`);
  }

  /** Delete a key. Persists to disk immediately. */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.flush();
    await debug('L1', `Deleted "${key}"`);
  }

  /** Check if a key exists. */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /** Get all keys. */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Export all data as a plain object (for backup / admin UI display).
   */
  exportAll(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [k, v] of this.cache) obj[k] = v;
    return obj;
  }

  // ── Internal ──

  private async ensureDir(): Promise<void> {
    const dir = this.dataPath.substring(0, this.dataPath.lastIndexOf('/'));
    if (!dir) return;
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch {
      // directory may already exist
    }
  }

  private async load(): Promise<void> {
    try {
      const text = await Deno.readTextFile(this.dataPath);
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') this.cache.set(k, v);
        }
      }
    } catch {
      // file doesn't exist or is invalid — start with empty cache
      this.cache.clear();
    }
  }

  private async flush(): Promise<void> {
    const obj: Record<string, string> = {};
    for (const [k, v] of this.cache) obj[k] = v;
    await Deno.writeTextFile(this.dataPath, JSON.stringify(obj, null, 2));
  }
}
