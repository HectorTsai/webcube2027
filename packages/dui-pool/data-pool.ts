/**
 * @dui/pool — DataPool: data-gateway proxy with cache layer
 *
 * Extends CachePool (string key, generic value) with:
 * - Data-gateway communication (URL resolution, API key, tenant headers)
 * - Generic HTTP proxy: `request(method, path, headers?, body?)`
 * - Convenience fetch: `fetch<T>()`, `fetchMany<T>()`
 * - Cached CRUD helpers: `getById`, `list`, `create`, `update`, `remove`
 *
 * Key convention for cached CRUD: `${level}:${collection}:${id}`
 *   e.g. `l2:使用者:00f61f6b`, `l3:Page~about:首頁`
 *
 * DG API response envelope:
 *   All CRUD handlers return `{ success: true, data: <payload>, source, ... }`
 *   or `{ success: false, error: 'message' }`.
 *
 * DG composite ID format: `collection:model:nanoid` (3 colon-separated parts).
 * Single-record GET/PUT/PATCH/DELETE require this format.
 *
 * List/filter: `GET /{level}/{collection}/{model}?{field}={value}`
 *
 * 快取形狀契約：泛用 CRUD 不把 DG 裸 json 直接寫入快取——`getById` 的回傳型別
 * 受 `T extends V` 約束（快取值必須符合 Pool 的 `V` 介面），`create`/`update`
 * 不自動寫快取，由呼叫端 Typed Wrapper 決定。詳見 docs/規格書.md 第 9 章。
 *
 * @typeParam V — Value type stored in cache (default `any`)
 */

import { CachePool } from './cache-pool.ts';
import type { PoolOptions } from './types.ts';

type FetchHeaders = Record<string, string>;

/** URL-encode Chinese chars while preserving `:`  (for composite IDs) */
const enc = (s: string) => encodeURI(s);

// ─── DataPool ────────────────────────────────────────────

export class DataPool<V = any> extends CachePool<string, V> {
  constructor(
    /** Resolver: returns data-gateway base URL (e.g. http://localhost:8002) */
    protected getDgUrl: () => Promise<string | null>,
    /** Resolver: returns the API key for data-gateway auth */
    protected getApiKey: () => Promise<string | null>,
    options: PoolOptions = {},
  ) {
    super(options);
  }

  // ═══════════════════════════════════════════════════════════
  //  Headers
  // ═══════════════════════════════════════════════════════════

  /**
   * Build base headers for data-gateway requests.
   * Automatically includes X-API-Key and optionally X-Tenant.
   */
  protected async baseHeaders(tenant?: string): Promise<FetchHeaders> {
    const headers: FetchHeaders = {
      'Content-Type': 'application/json',
    };

    const apiKey = await this.getApiKey();
    if (apiKey) headers['X-API-Key'] = apiKey;
    if (tenant) headers['X-Tenant'] = tenant;

    return headers;
  }

  // ═══════════════════════════════════════════════════════════
  //  Generic HTTP proxy (pass-through, no cache)
  // ═══════════════════════════════════════════════════════════

  /**
   * Generic HTTP proxy to data-gateway.
   * Requests are NOT cached — use `getById()` for cached reads.
   *
   * @param method  HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param path    Path from DG root, e.g. `/api/l2/使用者/使用者/使用者:使用者:00f61f6b`
   * @param headers Optional extra headers (merged with base)
   * @param body    Optional request body (auto-serialized)
   * @returns Raw Response (caller handles .json()/.ok)
   */
  async request(
    method: string,
    path: string,
    headers?: FetchHeaders,
    body?: unknown,
  ): Promise<Response> {
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) {
      throw new Error('DataPool: data-gateway URL not configured');
    }

    const base = await this.baseHeaders();
    const merged: FetchHeaders = { ...base, ...headers };

    return await fetch(`${dgUrl}${path}`, {
      method,
      headers: merged,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  Convenience fetches (no cache)
  // ═══════════════════════════════════════════════════════════

  /**
   * Fetch a single resource as typed JSON (no caching).
   * Returns `null` on non-ok response.
   */
  async fetch<T>(path: string, tenant?: string): Promise<T | null> {
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) return null;

    const res = await fetch(`${dgUrl}${path}`, {
      headers: await this.baseHeaders(tenant),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  }

  /**
   * Fetch a list/collection as typed JSON array (no caching).
   * Returns empty array on non-ok response.
   *
   * NOTE: DG handleList wraps data in `{ success, data: [...], pagination }`.
   * This helper unwraps `response.data`.
   */
  async fetchMany<T>(path: string, tenant?: string): Promise<T[]> {
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) return [];

    const res = await fetch(`${dgUrl}${path}`, {
      headers: await this.baseHeaders(tenant),
    });
    if (!res.ok) return [];

    const body = await res.json();
    return (body?.data ?? []) as T[];
  }

  // ═══════════════════════════════════════════════════════════
  //  Cached CRUD
  // ═══════════════════════════════════════════════════════════

  /**
   * Get by ID with read-through caching.
   *
   * DG path: GET /{level}/{compositeId}
   *   (composite ID → handleGetById)
   *
   * Response envelope: `{ success, data, source }`
   *
   * 快取形狀契約（以 model/interface 限制快取形狀）：
   *   回傳型別 T 必須是 pool 快取值型別 V 的子型別（`T extends V`），
   *   因此快取值永遠與 V 形狀一致。若呼叫端要的型別與 V 不同
   *   （例如 AccountPool 的快取值是 `{ user }` 包裝，而呼叫端想要裸 CachedUser），
   *   編譯器會直接拒絕——此時應改用池的 Typed Wrapper（如 AccountPool.getUserById）。
   *
   * @param map 當 DG 記錄與快取值形狀不同時，提供型別安全的轉換
   *   （例如 DG 回傳裸記錄，而快取需要 `{ user }` 包裝）。
   */
  async getById<T extends V>(
    level: string,
    collection: string,
    id: string,
    tenant?: string,
    ttlMs?: number,
    map?: (record: unknown) => T | null,
  ): Promise<T | null> {
    const cacheKey = `${level}:${collection}:${id}`;

    return await this.getOrFetch(cacheKey, async () => {
      // 呼叫端傳入的已是完整 composite ID（collection:model:id），直接使用，不再包裝
      const path = `/api/${level}/${enc(id)}`;

      const dgUrl = await this.getDgUrl();
      if (!dgUrl) return null;

      const res = await fetch(`${dgUrl}${path}`, {
        headers: await this.baseHeaders(tenant),
      });
      if (!res.ok) return null;

      const body = await res.json();
      const record = (body?.data ?? null) as unknown;
      // 預設快取值 = DG 記錄。若快取值與記錄形狀不同（例如包裝成 { user }），
      // 呼叫端必須提供 map 做型別安全轉換，不得用 `as unknown as V` 直接繞過，
      // 否則同一 cacheKey 會被不同形狀寫入，造成解包失敗。
      return (map ? map(record) : record) as T | null;
    }, ttlMs) as T | null;
  }

  /**
   * List resources (pass-through, no caching).
   *
   * DG path: GET /{level}/{collection}/{model}
   *   (model = collection → handleList with filters)
   *
   * Response envelope: `{ success, data: [...], pagination }`
   */
  async list<T>(
    level: string,
    collection: string,
    tenant?: string,
  ): Promise<T[]> {
    const path = `/api/${level}/${enc(collection)}/${enc(collection)}`;
    return await this.fetchMany<T>(path, tenant);
  }

  /**
   * Create a resource.
   *
   * DG path: POST /{level}/{collection}/{model}
   *
   * Response envelope: `{ success, data: createdRecord, source }`
   *
   * 快取策略：此方法**不寫入快取**。快取形狀必須由各池以 model/interface
   * 統一管理（例如 AccountPool.createUser 用 writeCachedUser 寫 `{ user }` 包裝），
   * 避免泛型方法以 `as unknown as V` 寫入與 V 形狀不一致的值。
   */
  async create<T extends { id?: string }>(
    level: string,
    collection: string,
    data: T,
    tenant?: string,
  ): Promise<T | null> {
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) return null;

    const res = await fetch(
      `${dgUrl}/api/${level}/${enc(collection)}/${enc(collection)}`,
      {
        method: 'POST',
        headers: await this.baseHeaders(tenant),
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) return null;

    const body = await res.json();
    const created = body?.data as T | undefined;
    if (!created) return null;

    return created;
  }

  /**
   * Update a resource.
   *
   * DG path: PUT|PATCH /{level}/{compositeId}   (compositeId = collection:model:id)
   *
   * Response envelope: `{ success, data: record, source }`
   *
   * 快取策略：此方法**不寫入快取**。快取形狀由各池以 model/interface 統一管理，
   * 避免 `as unknown as V` 寫入與 V 形狀不一致的值。
   * - PATCH（可能部分更新）→ 失效快取，由後續 read-through 重建。
   * - PUT（完整更新）→ 呼叫端（Typed Wrapper）自行決定快取策略。
   */
  async update<T>(
    level: string,
    collection: string,
    id: string,
    data: Partial<T>,
    tenant?: string,
    method: 'PUT' | 'PATCH' = 'PUT',
  ): Promise<T | null> {
    const cacheKey = `${level}:${collection}:${id}`;
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) return null;

    // 呼叫端傳入的已是完整 composite ID（collection:model:id）→ 單段路由
    const path = `/api/${level}/${enc(id)}`;

    const res = await fetch(`${dgUrl}${path}`, {
      method,
      headers: await this.baseHeaders(tenant),
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;

    const body = await res.json();

    if (method === 'PATCH') {
      // PATCH may return partial → invalidate cache
      this.items.delete(cacheKey);
      this.ttlMap?.delete(cacheKey);
    }

    const patched = body?.data as T | undefined;
    return patched ?? null;
  }

  /**
   * Delete a resource. Clears cache first, then removes from DG.
   *
   * DG path: DELETE /{level}/{collection}/{model}/{compositeId}
   *
   * Response: `{ success, data: { deleted: true } }`
   */
  async remove(
    level: string,
    collection: string,
    id: string,
    tenant?: string,
  ): Promise<boolean> {
    const cacheKey = `${level}:${collection}:${id}`;

    // Clear cache first (prevent stale reads during deletion)
    this.items.delete(cacheKey);

    const dgUrl = await this.getDgUrl();
    if (!dgUrl) return false;

    // 呼叫端傳入的已是完整 composite ID（collection:model:id）→ 單段路由
    const path = `/api/${level}/${enc(id)}`;

    const res = await fetch(`${dgUrl}${path}`, {
      method: 'DELETE',
      headers: await this.baseHeaders(tenant),
    });

    return res.ok;
  }
}