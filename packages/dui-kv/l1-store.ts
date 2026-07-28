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

import { info, debug, error } from '@dui/util';
import { dirname, resolve } from '@std/path';

const DEFAULT_DATA_PATH = './data/l1.json';

/**
 * Simple persistent key-value store backed by a JSON file.
 *
 * All data is cached in memory for fast reads. Writes flush to disk
 * via a single background task with dirty-flag coalescing, using an
 * atomic temp-file + rename pattern to prevent file corruption under
 * concurrent access.
 *
 * Sensitive fields should be pre-encrypted by the caller.
 */
export class L1Store {
  private dataPath: string;
  private cache = new Map<string, string>();
  /** Dirty flag — set true when cache has unsaved changes. */
  private isDirty = false;
  /** Reusable background flush task; null when idle. */
  private flushingTask: Promise<void> | null = null;

  constructor(dataPath?: string) {
    const rawPath = dataPath || Deno.env.get('L1_PATH') || DEFAULT_DATA_PATH;
    this.dataPath = resolve(rawPath);
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

  /** Set a value by key. Persists to disk asynchronously with coalescing. */
  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    await this.flush();
    await debug('L1', `Set "${key}"`);
  }

  /** Delete a key. Persists to disk asynchronously with coalescing. */
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
    return Object.fromEntries(this.cache);
  }

  // ── Internal ──

  private async ensureDir(): Promise<void> {
    const dir = dirname(this.dataPath);
    if (!dir || dir === '.') return;
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (err) {
      // Suppress "already exists", rethrow everything else (permission, disk, etc.)
      if (!(err instanceof Deno.errors.AlreadyExists)) throw err;
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

  /**
   * Dirty-flag coalescing flush.  Multiple concurrent calls share a single
   * background task that keeps flushing until the cache is clean.
   *
   * - No unbounded Promise chain growth (memory-safe).
   * - Concurrent callers all await the same single task.
   * - Rapid set/delete bursts are batched into one disk write.
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
          this.isDirty = true; // restore dirty flag so data is not silently lost
          await error('L1', `Flush failed: ${err}`);
          break; // exit loop to avoid infinite retry on permanent errors
        }
      }
    })().finally(() => {
      this.flushingTask = null;
    });

    return this.flushingTask;
  }

  /**
   * Atomic write: write to a uniquely-named temp file, then rename.
   * The unique suffix prevents cross-instance temp-file collisions.
   */
  private async atomicWrite(data: Record<string, string>): Promise<void> {
    const suffix = `${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    const tmpPath = `${this.dataPath}.${suffix}.tmp`;
    await Deno.writeTextFile(tmpPath, JSON.stringify(data, null, 2));
    await Deno.rename(tmpPath, this.dataPath);
  }
}