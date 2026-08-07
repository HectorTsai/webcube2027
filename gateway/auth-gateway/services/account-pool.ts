/**
 * AccountPool — 統一資料代理層（auth-gateway 專屬）
 *
 * 繼承 DataPool，加上 auth 專屬邏輯：
 * - 使用者驗證（verifyPassword、getUserByAccount）
 * - 登入鎖定（lockout、recordSuccess、recordFailure、isLocked）
 * - 角色權限合併（_getRolePermissions）
 * - 登入/登出事件暫存（pendingEvents → onFlush batch 寫回 DG）
 *
 * DataPool 已提供：request()、baseHeaders()、泛用 CRUD（getById、
 * list、create、update、remove）、read-through 快取、TTL。
 *
 * Key 設計：
 * - 一般快取 key = `{level}:使用者:{userId}`（如 `l2:使用者:00f61f6b`）
 * - Lockout key = `_lockout:L2:{帳號}` 或 `_lockout:L3:{tenant}:{帳號}`
 * - 登入時掃描所有 items 的 `帳號` 欄位比對，不需輔助索引
 *
 * 與 local.ts 的契約：
 * - getUserByAccount() 回傳 CachedUser（含 密碼雜湊、權限、_layer）— 同步
 * - isLocked() — 同步
 * - recordFailure(帳號, tenant) — 同步
 * - recordSuccess(帳號, tenant, user, ip?) — 同步
 * - verifyPassword(帳號, 密碼, tenant?) → { success, data, error } — 非同步
 */

import { DataPool } from '@dui/pool';
import type { PoolOptions, PoolItem } from '@dui/pool';
import { mergePermissions } from '@dui/framework';
import type { PermissionMap } from '@dui/framework';
import bcrypt from 'bcryptjs';
import {
  getDataGatewayUrl,
  getDataGatewayApiKey,
} from '../utils/config.ts';

// ─── Types ──────────────────────────────────────────────

/**
 * DG 回傳的使用者原始資料形狀（plain JSON，非 class instance）。
 * 與 `使用者介面` 同構但不要求 class methods。
 */
export type RawUser = {
  id: string;
  帳號: string;
  密碼雜湊: string;
  /** 相容舊欄位名（若 DG 仍存 `密碼`） */
  密碼?: string;
  名稱: unknown;
  圖示?: string;
  角色: string[];
  其他資訊?: Record<string, string>;
  最後登入?: string;
  tags?: string[];
};

/**
 * 快取中的使用者型別（DG 資料 + auth 中繼資料）。
 * 比 local.ts 需要的字段（密碼雑湊、權限、_layer）都齊全。
 */
export type CachedUser = RawUser & {
  _layer: 'l2' | 'l3';
  權限: PermissionMap;
};

/** AccountPool 中儲存的值型態 */
export type AccountCacheValue = {
  user: CachedUser;
  pendingEvents?: Array<{
    type: 'login' | 'logout';
    data: Record<string, unknown>;
  }>;
};

export type VerifyPasswordResult =
  | { success: true; data: CachedUser }
  | { success: false; error: string };

/** `_buildKey()` 的回傳型態 */
type BuildKeyOutput = {
  id: string;
  tenant: string | null;
  scope: 'l2' | 'l3';
};

// ─── AccountPool ────────────────────────────────────────

export class AccountPool extends DataPool<AccountCacheValue> {
  private _dgUrlCache: string | null = null;
  private _apiKeyCache: string | null = null;

  constructor(options: PoolOptions = {}) {
    const getDgUrl = async () => {
      if (this._dgUrlCache) return this._dgUrlCache;
      const url = await getDataGatewayUrl();
      if (url) this._dgUrlCache = url;
      return url;
    };
    const getApiKey = async () => {
      if (this._apiKeyCache) return this._apiKeyCache;
      const key = await getDataGatewayApiKey();
      if (key) this._apiKeyCache = key;
      return key;
    };
    super(getDgUrl, getApiKey, options);
  }

  // ═══════════════════════════════════════════════════════
  //  Cache Key Helpers
  // ═══════════════════════════════════════════════════════

  private _buildKey(帳號: string, tenant?: string): BuildKeyOutput {
    if (!tenant) {
      return { id: `L2:${帳號}`, tenant: null, scope: 'l2' };
    }
    return { id: `L3:${tenant}:${帳號}`, tenant, scope: 'l3' };
  }

  private lockoutKey(帳號: string, tenant?: string): string {
    const { id } = this._buildKey(帳號, tenant);
    return `_lockout:${id}`;
  }

  /**
   * 使用者快取的 key 建構（統一格式：`{level}:使用者:{compositeId}`）。
   * 所有使用者快取讀寫都必須透過本 class 的 helper，
   * 避免「同一 key 被不同形狀的值寫入」造成解包失敗。
   */
  private userCacheKey(level: string, id: string): string {
    return `${level}:使用者:${id}`;
  }

  /**
   * 讀取使用者快取（統一 AccountCacheValue 形狀）。
   * 不允許直接操作底層 key 或接受其他形狀（如 getById 的裸記錄）。
   */
  private readCachedUser(level: string, id: string): CachedUser | null {
    const item = this.items.get(this.userCacheKey(level, id));
    if (!item) return null;
    const value = item.value as AccountCacheValue | null;
    return value?.user ?? null;
  }

  /** 寫入使用者快取（統一 { user } 包裝，符合 AccountCacheValue 型別） */
  private writeCachedUser(level: string, user: CachedUser, markDirty = false): void {
    this.set(this.userCacheKey(level, user.id), { user }, markDirty);
  }

  /** 刪除使用者快取 */
  private deleteCachedUser(level: string, id: string): void {
    this.delete(this.userCacheKey(level, id));
  }

  // ═══════════════════════════════════════════════════════
  //  Typed CRUD Wrappers
  // ═══════════════════════════════════════════════════════

  async getUserById(id: string, tenant?: string): Promise<CachedUser | null> {
    const level = tenant ? 'l3' : 'l2';

    // 命中快取（統一 AccountCacheValue 形狀）
    const cached = this.readCachedUser(level, id);
    if (cached) return cached;

    // miss → 打 data-gateway（id 已是完整 composite ID → 單段路由）
    // 注意：不能套用 DataPool.getById——它的 fetcher 以 `as unknown as V` 把 DG 裸記錄
    // 直接當成快取值，與 AccountCacheValue（{ user } 包裝）形狀不一致。
    const headers: Record<string, string> = {};
    if (tenant) headers['X-Tenant'] = tenant;
    try {
      const res = await this.request(
        'GET',
        `/api/${level}/${encodeURI(id)}`,
        headers,
      );
      if (!res.ok) return null;
      const body = await res.json() as { success?: boolean; data?: unknown };
      if (!body?.success || !body.data) return null;

      const user = body.data as CachedUser;
      this.writeCachedUser(level, user);
      return user;
    } catch {
      return null;
    }
  }

  async listUsers(
    layer: string,
    tenant?: string,
    qParams?: Record<string, string>,
  ): Promise<{ success: boolean; data?: CachedUser[]; pagination?: unknown; error?: string }> {
    // 手動建構請求（因為 DataPool.list 不支援 query params）
    let path = `/api/${layer}/%E4%BD%BF%E7%94%A8%E8%80%85/%E4%BD%BF%E7%94%A8%E8%80%85`;
    if (qParams && Object.keys(qParams).length > 0) {
      path += `?${new URLSearchParams(qParams).toString()}`;
    }

    const headers: Record<string, string> = {};
    if (tenant) headers['X-Tenant'] = tenant;

    const res = await this.request('GET', path, headers);
    if (!res.ok) return { success: false };

    const body = await res.json() as Record<string, unknown>;
    if (!body?.success) return { success: false };

    const rawItems = (body.data ?? []) as RawUser[];
    const data: CachedUser[] = rawItems.map(u => ({
      ...u,
      _layer: layer as 'l2' | 'l3',
      權限: {},
    } as unknown as CachedUser));

    return {
      success: true,
      data,
      pagination: body.pagination,
    };
  }

  async createUser(
    layer: string,
    tenant: string | undefined,
    data: Record<string, unknown>,
  ): Promise<{ success: boolean; data?: CachedUser; error?: string }> {
    const level = layer === 'l3' ? 'l3' : 'l2';
    const body: RawUser = data as unknown as RawUser;
    if (body.密碼雜湊 && !body.密碼雜湊.startsWith('$2')) {
      body.密碼雜湊 = await bcrypt.hash(body.密碼雜湊, 10);
    }
    try {
      const created = await this.create<RawUser>(level, '使用者', body, tenant);
      if (!created) return { success: false, error: '建立使用者失敗' };

      const cachedUser: CachedUser = {
        ...created,
        _layer: level,
        權限: {},
      };
      this.writeCachedUser(level, cachedUser);
      return { success: true, data: cachedUser };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async updateUser(
    id: string,
    method: 'PUT' | 'PATCH',
    tenant: string | undefined,
    data: Partial<RawUser>,
  ): Promise<{ success: boolean; data?: RawUser; error?: string }> {
    const level = tenant ? 'l3' : 'l2';
    try {
      const updated = await this.update<RawUser>(
        level, '使用者', id, data, tenant, method,
      );
      if (!updated) return { success: false, error: '更新使用者失敗' };
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async deleteUser(
    id: string,
    tenant?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const level = tenant ? 'l3' : 'l2';
    try {
      // 先清快取（統一走 typed helper，不依賴 remove 的內部清理）
      this.deleteCachedUser(level, id);
      const ok = await this.remove(level, '使用者', id, tenant);
      return ok ? { success: true } : { success: false, error: '刪除使用者失敗' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ═══════════════════════════════════════════════════════
  //  Auth Methods
  // ═══════════════════════════════════════════════════════

  /**
   * 掃描所有 pool items 比對帳號欄位。
   * 記憶體內掃描（微秒級），不需輔助索引。
   */
  getUserByAccount(帳號: string, tenant?: string): CachedUser | null {
    for (const item of this.items.values()) {
      const u = item.value.user;
      if (u?.帳號 === 帳號) {
        if (tenant) {
          const key = this._buildKey(帳號, tenant);
          for (const k of this.items.keys()) {
            if (String(k).includes(key.id) && !String(k).startsWith('_lockout')) {
              return u;
            }
          }
          continue;
        }
        return u;
      }
    }
    return null;
  }

  /**
   * 驗證帳號密碼 — 整合 pool 快取 + data-gateway 查詢。
   *
   * 流程：
   * 1. 先掃描 pool items 比對帳號（getUserByAccount）— 同步
   * 2. 快取 hit → 直接 bcrypt 比對（不需 HTTP 請求）
   * 3. 快取 miss → 透過 data-gateway CRUD API 查詢
   * 4. 成功 → 寫入快取 + 合併權限回傳
   */
  async verifyPassword(
    帳號: string,
    密碼: string,
    tenant?: string,
  ): Promise<VerifyPasswordResult> {
    // 1. Check pool cache first (sync, no I/O)
    const cachedUser = this.getUserByAccount(帳號, tenant);
    if (cachedUser) {
      const pwdHash = cachedUser.密碼雜湊 ?? cachedUser.密碼 ?? '';
      const match = pwdHash.startsWith('$2')
        ? await bcrypt.compare(密碼, pwdHash)
        : 密碼 === pwdHash;
      if (!match) {
        return { success: false, error: '帳號或密碼錯誤' };
      }
      return { success: true, data: cachedUser };
    }

    // 2. Cache miss — fetch via data-gateway
    const collection = '使用者';
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) {
      return { success: false, error: 'data-gateway 無法連線' };
    }

    // 嘗試的層級順序：有 tenant 時先 L3 再 L2（L3 找不到時 fallback），無 tenant 時只 L2。
    // 若在 L3 找到使用者但密碼錯誤，不嘗試 L2（避免跨層密碼碰撞）。
    const levels = tenant ? ['l3', 'l2'] : ['l2'];
    for (const level of levels) {
      const actualTenant = level === 'l3' ? tenant : undefined;
      const headers: Record<string, string> = {};
      if (actualTenant) headers['X-Tenant'] = actualTenant;

      const res = await this.request(
        'GET',
        `/api/${level}/${collection}/${collection}?帳號=${encodeURIComponent(帳號)}`,
        headers,
      );
      if (!res.ok) continue;

      const body = await res.json() as Record<string, unknown>;
      if (!body?.success) continue;

      const usersList = (body.data ?? []) as Array<Record<string, unknown>>;
      const user = usersList?.[0];
      if (!user) continue;  // 此層找不到 → 嘗試下一層

      // 3. Verify password (with plain-text fallback)
      const pwdHash = user['密碼雜湊'] as string ?? user['密碼'] as string ?? '';
      const match = pwdHash.startsWith('$2')
        ? await bcrypt.compare(密碼, pwdHash)
        : 密碼 === pwdHash;
      if (!match) {
        // 在此層找到使用者但密碼錯誤 → 不嘗試下一層
        return { success: false, error: '帳號或密碼錯誤' };
      }

      // 4. Fetch & merge role permissions
      const roles = (user['角色'] ?? []) as string[];
      const permissions = await this._getRolePermissions(roles);

      // 5. Build CachedUser and write to cache
      const cachedUserFull: CachedUser = {
        ...(user as unknown as RawUser),
        _layer: level as 'l2' | 'l3',
        權限: permissions,
      };
      this.writeCachedUser(level, cachedUserFull);

      return { success: true, data: cachedUserFull };
    }

    return { success: false, error: '使用者不存在' };
  }

  // ═══════════════════════════════════════════════════════
  //  Login/Logout Events + Lockout
  // ═══════════════════════════════════════════════════════

  recordSuccess(
    _帳號: string,
    _tenant: string | undefined,
    user: CachedUser,
    ip?: string,
  ): void {
    if (!user?.id) return;

    // 層級以使用者實際 _layer 為準：L3→L2 fallback 登入時，
    // login 傳入的 tenant 可能指向 L3，但使用者實際在 L2，
    // 若用 tenant 會把 L2 使用者寫進 l3 快取（改密碼時清不到）。
    const layer = user._layer === 'l3' ? 'l3' : 'l2';
    const cacheKey = this.userCacheKey(layer, user.id);
    const existing = this.items.get(cacheKey);

    const events = existing?.value.pendingEvents ?? [];
    events.push({
      type: 'login',
      data: {
        id: user.id,
        ip: ip ?? 'unknown',
        time: new Date().toISOString(),
      },
    });

    const updatedUser: CachedUser = {
      ...user,
      最後登入: new Date().toISOString(),
    };

    this.set(cacheKey, { user: updatedUser, pendingEvents: events }, true);
  }

  recordFailure(帳號: string, tenant?: string): void {
    const lockKey = this.lockoutKey(帳號, tenant);
    const existing = this.items.get(lockKey);
    const now = Date.now();
    const attempts = existing?.value
      ? ((existing.value as unknown as Record<string, unknown>).attempts as number ?? 0) + 1
      : 1;
    const lockedUntil = attempts >= 5 ? now + 10 * 60 * 1000 : null;

    this.items.set(lockKey, {
      value: {
        attempts,
        lastAttempt: now,
        lockedUntil,
      } as unknown as AccountCacheValue,
      lastAccessed: now,
      accessCount: 1,
      isDirty: false,
      persistent: false,
    } as PoolItem<AccountCacheValue>);
  }

  isLocked(帳號: string, tenant?: string): boolean {
    const lockKey = this.lockoutKey(帳號, tenant);
    const item = this.items.get(lockKey);
    if (!item) return false;

    const data = item.value as unknown as {
      attempts: number;
      lockedUntil: number | null;
    };
    if (!data.lockedUntil) return false;
    if (Date.now() > data.lockedUntil) {
      this.items.delete(lockKey);
      return false;
    }
    return true;
  }

  /** 目前仍被鎖定的帳號數（lockout 項目中 lockedUntil 尚未過期） */
  getFrozenCount(): number {
    let count = 0;
    for (const [key, item] of this.items.entries()) {
      if (!key.startsWith('_lockout:')) continue;
      const data = item.value as unknown as {
        attempts: number;
        lockedUntil: number | null;
      };
      if (data.lockedUntil && Date.now() < data.lockedUntil) count++;
    }
    return count;
  }

  recordLogout(帳號: string, tenant?: string): void {
    const user = this.getUserByAccount(帳號, tenant);
    if (!user?.id) return;

    // 同 recordSuccess：層級以實際 _layer 為準
    const layer = user._layer === 'l3' ? 'l3' : 'l2';
    const cacheKey = this.userCacheKey(layer, user.id);
    const existing = this.items.get(cacheKey);
    if (!existing) return;

    const events = existing.value.pendingEvents ?? [];
    events.push({
      type: 'logout',
      data: {
        id: user.id,
        time: new Date().toISOString(),
      },
    });

    this.set(cacheKey, { ...existing.value, pendingEvents: events }, true);
  }

  // ═══════════════════════════════════════════════════════
  //  BasePool Lifecycle Hooks
  // ═══════════════════════════════════════════════════════

  protected override async onFlush(
    dirtyItems: Map<string, AccountCacheValue>,
  ): Promise<void> {
    const dgUrl = await this.getDgUrl();
    const apiKey = await this.getApiKey();
    if (!dgUrl || !apiKey) return;

    for (const [key, value] of dirtyItems) {
      if (!value.pendingEvents?.length) continue;

      const isL3 = key.startsWith('l3:');
      const level = isL3 ? 'l3' : 'l2';

      for (const event of value.pendingEvents) {
        try {
          await this.request(
            'POST',
            `/api/${level}/使用者`,
            undefined,
            event.data,
          );
        } catch {
          // flush 失敗不影響主流程，下次 flush 會重試
        }
      }

      value.pendingEvents = [];
    }
  }

  // ═══════════════════════════════════════════════════════
  //  Internal
  // ═══════════════════════════════════════════════════════

  private async _getRolePermissions(
    角色IDs: string[],
  ): Promise<PermissionMap> {
    if (!角色IDs || 角色IDs.length === 0) return { l2: {}, l3: {} };

    const allPermissions: Array<Record<string, unknown>> = [];

    for (const 角色id of 角色IDs) {
      const res = await this.request(
        'GET',
        `/api/l2/${encodeURIComponent(角色id)}`,
      );
      if (res.ok) {
        const body = await res.json() as { success?: boolean; data?: Record<string, unknown> };
        if (body?.success && body.data) {
          allPermissions.push(body.data);
        }
      }
    }

    if (allPermissions.length === 0) return { l2: {}, l3: {} };
    return mergePermissions(allPermissions) as PermissionMap;
  }
}

/** 全域唯一實例 */
export const accountPool = new AccountPool();