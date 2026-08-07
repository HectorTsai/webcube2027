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
 * @typeParam V — Value type stored in cache (default `any`)
 */

import { CachePool } from './cache-pool.ts';
import type { PoolOptions } from './types.ts';

type FetchHeaders = Record<string, string>;

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
   * @param path    Path from DG root, e.g. `/api/l2/使用者/00f61f6b`
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
   */
  async fetchMany<T>(path: string, tenant?: string): Promise<T[]> {
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) return [];

    const res = await fetch(`${dgUrl}${path}`, {
      headers: await this.baseHeaders(tenant),
    });
    if (!res.ok) return [];
    return await res.json() as T[];
  }

  // ═══════════════════════════════════════════════════════════
  //  Cached CRUD
  // ═══════════════════════════════════════════════════════════

  /**
   * Get by ID with read-through caching.
   * Cache key: `${level}:${collection}:${id}`.
   */
  async getById<T>(
    level: string,
    collection: string,
    id: string,
    tenant?: string,
    ttlMs?: number,
  ): Promise<T | null> {
    const cacheKey = `${level}:${collection}:${id}`;

    return await this.getOrFetch(cacheKey, async () => {
      const path = `/api/${level}/${collection}/${encodeURIComponent(id)}`;
      const dgUrl = await this.getDgUrl();
      if (!dgUrl) return null;

      const res = await fetch(`${dgUrl}${path}`, {
        headers: await this.baseHeaders(tenant),
      });
      if (!res.ok) return null;
      return await res.json() as unknown as V;
    }, ttlMs) as unknown as T | null;
  }

  /**
   * List resources (pass-through, no caching).
   */
  async list<T>(
    level: string,
    collection: string,
    tenant?: string,
  ): Promise<T[]> {
    const path = `/api/${level}/${collection}`;
    return await this.fetchMany<T>(path, tenant);
  }

  /**
   * Create a resource. On success, cache the created item.
   */
  async create<T extends { id?: string }>(
    level: string,
    collection: string,
    data: T,
    tenant?: string,
  ): Promise<T | null> {
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) return null;

    const res = await fetch(`${dgUrl}/api/${level}/${collection}`, {
      method: 'POST',
      headers: await this.baseHeaders(tenant),
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;

    const created = await res.json() as T;

    // Cache the newly created item if it has an id
    const createdId = (created as any)?.id;
    if (createdId) {
      const cacheKey = `${level}:${collection}:${createdId}`;
      this.set(cacheKey, created as unknown as V, false);
    }

    return created;
  }

  /**
   * Update a resource.
   * - PUT: cache the full response (updated item).
   * - PATCH: invalidate cache (response may be partial).
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

    const res = await fetch(
      `${dgUrl}/api/${level}/${collection}/${encodeURIComponent(id)}`,
      {
        method,
        headers: await this.baseHeaders(tenant),
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) return null;

    if (method === 'PUT') {
      // PUT returns full data → update cache
      const updated = await res.json() as T;
      this.set(cacheKey, updated as unknown as V, false);
      return updated;
    } else {
      // PATCH may return partial → invalidate cache
      this.items.delete(cacheKey);
      this.ttlMap?.delete(cacheKey);
      return await res.json() as T;
    }
  }

  /**
   * Delete a resource. Clears cache first, then removes from DG.
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

    const res = await fetch(
      `${dgUrl}/api/${level}/${collection}/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: await this.baseHeaders(tenant),
      },
    );

    return res.ok;
  }
}