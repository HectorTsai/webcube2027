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
import bcrypt from 'bcryptjs';
import {
  getDataGatewayUrl,
  getDataGatewayApiKey,
} from '../utils/config.ts';

// ─── Types ──────────────────────────────────────────────

/** 資料庫中的使用者模型（class，這裡只用型別形狀） */
type 使用者 = import('../database/models/使用者.ts').使用者;

/**
 * 快取中的使用者型別 = 使用者 + auth 專屬中繼資料。
 * 比 local.ts 需要的字段（密碼雜湊、權限、_layer）都齊全。
 */
export type CachedUser = 使用者 & {
  _layer: 'l2' | 'l3';
  權限: Record<string, unknown>;
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

  /**
   * 根據帳號與 tenant 計算 composite key（用於 lockout）。
   */
  private _buildKey(帳號: string, tenant?: string): BuildKeyOutput {
    if (!tenant) {
      return { id: `L2:${帳號}`, tenant: null, scope: 'l2' };
    }
    return { id: `L3:${tenant}:${帳號}`, tenant, scope: 'l3' };
  }

  /**
   * 取得 lockout key。
   */
  private lockoutKey(帳號: string, tenant?: string): string {
    const { id } = this._buildKey(帳號, tenant);
    return `_lockout:${id}`;
  }

  // ═══════════════════════════════════════════════════════
  //  Typed CRUD Wrappers
  // ═══════════════════════════════════════════════════════

  async getUserById(id: string, tenant?: string): Promise<CachedUser | null> {
    const level = tenant ? 'l3' : 'l2';
    // getById 回傳的是快取中的 AccountCacheValue，需要取出 .user
    const cached = await this.getById<AccountCacheValue>(level, '使用者', id, tenant);
    return cached?.user ?? null;
  }

  async listUsers(tenant?: string): Promise<CachedUser[]> {
    const level = tenant ? 'l3' : 'l2';
    const items = await this.list<使用者>(level, '使用者', tenant);
    // 從 data-gateway 回傳的是原始使用者資料，不包含 ._layer / .權限
    // 這裡只做型別轉換，呼叫端如需要完整 CachedUser 應透過快取
    return items.map(u => ({
      ...u,
      _layer: level as 'l2' | 'l3',
      權限: {},
    } as unknown as CachedUser));
  }

  async createUser(data: 使用者, tenant?: string): Promise<CachedUser | null> {
    // Hash the password before storing
    if (data.密碼雜湊) {
      data.密碼雜湊 = await bcrypt.hash(data.密碼雜湊, 10);
    }
    const level = tenant ? 'l3' : 'l2';
    const created = await this.create<使用者>(level, '使用者', data, tenant);
    if (!created) return null;

    // Wrap into CachedUser and cache it
    const cachedUser: CachedUser = {
      ...created,
      _layer: level as 'l2' | 'l3',
      權限: {},
    };
    const cacheKey = `${level}:使用者:${created.id}`;
    this.set(cacheKey, { user: cachedUser }, false);
    return cachedUser;
  }

  async updateUser(
    method: 'PUT' | 'PATCH',
    id: string,
    data: Partial<使用者>,
    tenant?: string,
  ): Promise<使用者 | null> {
    const level = tenant ? 'l3' : 'l2';
    return await this.update<使用者>(level, '使用者', id, data, tenant, method);
  }

  async deleteUser(id: string, tenant?: string): Promise<boolean> {
    const level = tenant ? 'l3' : 'l2';
    return await this.remove(level, '使用者', id, tenant);
  }

  // ═══════════════════════════════════════════════════════
  //  Auth Methods
  // ═══════════════════════════════════════════════════════

  /**
   * 掃描所有 pool items 比對帳號欄位。
   * 記憶體內掃描（微秒級），不需輔助索引。
   *
   * 回傳 CachedUser（含 密碼雜湊 供 bcrypt 比對、含 權限 供 payload）。
   */
  getUserByAccount(帳號: string, tenant?: string): CachedUser | null {
    for (const item of this.items.values()) {
      const u = item.value.user;
      if (u?.帳號 === 帳號) {
        // 如果有指定 tenant，確認快取 key 包含該 tenant
        if (tenant) {
          const key = this._buildKey(帳號, tenant);
          // 掃描 keys 看是否有對應的 tenant key
          for (const k of this.items.keys()) {
            if (String(k).includes(key.id) && !String(k).startsWith('_lockout')) {
              return u;
            }
          }
          continue; // 沒找到該 tenant 的項目，繼續掃描
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
      const match = await bcrypt.compare(密碼, cachedUser.密碼雜湊 ?? '');
      if (!match) {
        return { success: false, error: '帳號或密碼錯誤' };
      }
      return { success: true, data: cachedUser };
    }

    // 2. Cache miss — fetch via data-gateway
    const level = tenant ? 'l3' : 'l2';
    const collection = '使用者';
    const dgUrl = await this.getDgUrl();
    if (!dgUrl) {
      return { success: false, error: 'data-gateway 無法連線' };
    }

    const res = await this.request(
      'GET',
      `/api/${level}/${collection}?帳號=${encodeURIComponent(帳號)}`,
    );
    if (!res.ok) {
      return { success: false, error: '查詢使用者失敗' };
    }

    const usersList = await res.json() as 使用者[];
    const user = usersList?.[0];
    if (!user) {
      return { success: false, error: '使用者不存在' };
    }

    // 3. Verify password
    const match = await bcrypt.compare(密碼, user.密碼雜湊 ?? '');
    if (!match) {
      return { success: false, error: '帳號或密碼錯誤' };
    }

    // 4. Fetch & merge role permissions
    const permissions = await this._getRolePermissions(user.角色 ?? []);

    // 5. Build CachedUser and write to cache
    const cachedUserFull: CachedUser = {
      ...user,
      _layer: level as 'l2' | 'l3',
      權限: permissions,
    };
    const cacheKey = `${level}:${collection}:${user.id}`;
    this.set(cacheKey, { user: cachedUserFull }, false);

    return { success: true, data: cachedUserFull };
  }

  // ═══════════════════════════════════════════════════════
  //  Login/Logout Events + Lockout
  // ═══════════════════════════════════════════════════════

  /**
   * 記錄登入成功：更新 pool 快取中的 pendingEvents，
   * 以及最後登入時間與 IP。
   *
   * 同步操作（僅操作 Map）。
   */
  recordSuccess(
    帳號: string,
    tenant: string | undefined,
    user: CachedUser,
    ip?: string,
  ): void {
    if (!user?.id) return;

    const cacheKey = `${tenant ? 'l3' : 'l2'}:使用者:${user.id}`;
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

  /**
   * 記錄登入失敗。累計失敗次數超過 5 次則鎖定帳號 10 分鐘。
   *
   * 同步操作（僅操作 Map）。
   */
  recordFailure(帳號: string, tenant?: string): void {
    const lockKey = this.lockoutKey(帳號, tenant);
    const existing = this.items.get(lockKey);
    const now = Date.now();
    const attempts = existing?.value
      ? ((existing.value as unknown as Record<string, unknown>).attempts as number ?? 0) + 1
      : 1;
    const lockedUntil = attempts >= 5 ? now + 10 * 60 * 1000 : null;

    // Store lockout data directly in items map
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

  /**
   * 檢查帳號是否被鎖定。
   *
   * 同步操作（僅操作 Map）。
   */
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
      // Lockout expired — clean up
      this.items.delete(lockKey);
      return false;
    }
    return true;
  }

  /**
   * 記錄登出事件（寫入 pool，由 flush batch 回 data-gateway）。
   *
   * 同步操作（僅操作 Map）。
   */
  recordLogout(帳號: string, tenant?: string): void {
    const user = this.getUserByAccount(帳號, tenant);
    if (!user?.id) return;

    const cacheKey = `${tenant ? 'l3' : 'l2'}:使用者:${user.id}`;
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

  /**
   * Flush pending login/logout events to data-gateway.
   *
   * DataPool 的 onFlush 是 no-op（read-through 快取不需 flush），
   * 但 AccountPool 需要將 pendingEvents batch 寫回 DG。
   */
  protected override async onFlush(
    dirtyItems: Map<string, AccountCacheValue>,
  ): Promise<void> {
    const dgUrl = await this.getDgUrl();
    const apiKey = await this.getApiKey();
    if (!dgUrl || !apiKey) return;

    for (const [key, value] of dirtyItems) {
      if (!value.pendingEvents?.length) continue;

      const isL3 = key.startsWith('l3:');
      const tenant = isL3 ? key.split(':')[1] : undefined;
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

      // Clear flushed events
      value.pendingEvents = [];
    }
  }

  // ═══════════════════════════════════════════════════════
  //  Internal
  // ═══════════════════════════════════════════════════════

  /**
   * 查詢角色權限並以 mergePermissions 合併。
   * 內部方法 — 使用 DataPool 的 request() 與 getDgUrl()。
   */
  private async _getRolePermissions(
    角色IDs: string[],
  ): Promise<Record<string, unknown>> {
    if (!角色IDs || 角色IDs.length === 0) return { l2: {}, l3: {} };

    // 從 L2 SYSTEM collection 讀取角色權限
    // 角色權限統一存在 L2，collection 名稱為「角色權限」
    const allPermissions: Array<Record<string, unknown>> = [];

    for (const 角色id of 角色IDs) {
      const res = await this.request(
        'GET',
        `/api/l2/角色權限/${encodeURIComponent(角色id)}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.permissions) {
          allPermissions.push(data.permissions);
        }
      }
    }

    if (allPermissions.length === 0) return { l2: {}, l3: {} };
    return mergePermissions(allPermissions);
  }
}

/** 全域唯一實例 */
export const accountPool = new AccountPool();