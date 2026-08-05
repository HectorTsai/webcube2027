/**
 * AccountPool — 帳號快取 + 登入凍結 + Batch flush
 *
 * 繼承 @dui/pool 的 BasePool，提供：
 *   1. 快取帳號資料（減少重複打 data-gateway）
 *   2. 登入失敗計數 → 達 5 次凍結 10 分鐘
 *   3. Pending 登入/登出紀錄 → onFlush batch 寫回 data-gateway
 *   4. 內建 getStatus() 供管理員 dashboard 檢視
 *
 * Key 格式：
 *   L2： "L2:{帳號}"
 *   L3： "L3:{tenant}:{帳號}"
 */

import { BasePool } from '@dui/pool';
import { 登入紀錄 } from '../database/models/登入紀錄.ts';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../utils/config.ts';

export interface CachedUser {
  id: string;
  帳號: string;
  名稱: unknown;
  角色: string[];
  _layer: string;
  權限: Record<string, unknown>;
  密碼雜湊: string; // 僅記憶體快取用，不對外暴露
}

export interface PendingAuthEvent {
  type: 'login' | 'logout';
  record: Record<string, unknown>;
}

export interface AccountCacheValue {
  user?: CachedUser;
  failedAttempts: number;
  lockedUntil: number | null;
  pendingEvents?: PendingAuthEvent[];
}

export class AccountPool extends BasePool<string, AccountCacheValue> {
  static readonly MAX_FAILURES = 5;
  static readonly LOCKOUT_MS = 10 * 60_000; // 10 分鐘

  constructor() {
    super({
      maxSize: 5000,
      maxIdleMs: 10 * 60_000,    // 10 分鐘無存取 → 自動清除
      cleanupIntervalMs: 60_000, // 每 60 秒掃描過期項目
      flushIntervalMs: 5_000,    // 每 5 秒 batch flush 一次
    });
  }

  /** 產生 pool key */
  buildKey(帳號: string, tenant?: string): string {
    return tenant ? `L3:${tenant}:${帳號}` : `L2:${帳號}`;
  }

  /** 檢查帳號是否被凍結 */
  isLocked(帳號: string, tenant?: string): boolean {
    const item = this.get(this.buildKey(帳號, tenant));
    if (!item) return false;

    // 凍結已過期 → 自動清除
    if (item.lockedUntil && item.lockedUntil <= Date.now()) {
      item.lockedUntil = null;
      item.failedAttempts = 0;
      return false;
    }

    return item.lockedUntil !== null;
  }

  /** 記錄一次失敗嘗試 → 達閾值自動凍結 */
  recordFailure(帳號: string, tenant?: string): void {
    const key = this.buildKey(帳號, tenant);
    const existing = this.get(key);
    const value: AccountCacheValue = existing ?? {
      failedAttempts: 0,
      lockedUntil: null,
    };
    value.failedAttempts++;
    if (value.failedAttempts >= AccountPool.MAX_FAILURES) {
      value.lockedUntil = Date.now() + AccountPool.LOCKOUT_MS;
    }
    this.set(key, value, true);
  }

  /** 記錄登入成功 → 清除凍結 + 暫存登入紀錄 */
  recordSuccess(
    帳號: string,
    tenant: string | undefined,
    user: CachedUser,
    ip?: string,
  ): void {
    const key = this.buildKey(帳號, tenant);
    const record = new 登入紀錄({
      帳號,
      租戶: tenant,
      層級: user._layer as 'L2' | 'L3',
      事件: 'login',
      ip,
    });

    const value: AccountCacheValue = {
      user,
      failedAttempts: 0,
      lockedUntil: null,
      pendingEvents: [{
        type: 'login',
        record: record.toJSON() as Record<string, unknown>,
      }],
    };
    this.set(key, value, true);
  }

  /** 暫存登出紀錄（由 logout handler 呼叫） */
  recordLogout(帳號: string, tenant?: string, layer?: 'L2' | 'L3'): void {
    const key = this.buildKey(帳號, tenant);
    const record = new 登入紀錄({
      帳號,
      租戶: tenant,
      層級: layer ?? (tenant ? 'L3' : 'L2'),
      事件: 'logout',
    });

    const existing = this.get(key) ?? {
      failedAttempts: 0,
      lockedUntil: null,
    };
    existing.pendingEvents = existing.pendingEvents ?? [];
    existing.pendingEvents.push({
      type: 'logout',
      record: record.toJSON() as Record<string, unknown>,
    });
    this.set(key, existing, true);
  }

  /** 回傳目前被凍結的帳號數量（供 health endpoint 使用） */
  getFrozenCount(): number {
    let count = 0;
    const now = Date.now();
    for (const key of this.keys()) {
      const item = this.get(key);
      if (item && item.lockedUntil && item.lockedUntil > now) count++;
    }
    return count;
  }

  // ── BasePool lifecycle hooks ──

  protected async onFlush(dirtyItems: Map<string, AccountCacheValue>): Promise<void> {
    const dgUrl = await getDataGatewayUrl();
    const apiKey = await getDataGatewayApiKey();
    if (!dgUrl || !apiKey) return;

    for (const [key, value] of dirtyItems) {
      if (!value.pendingEvents?.length) continue;

      const isL3 = key.startsWith('L3:');
      const tenant = isL3 ? key.split(':')[1] : undefined;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      };
      if (tenant) headers['X-Tenant'] = tenant;

      const layer = isL3 ? 'l3' : 'l2';

      for (const event of value.pendingEvents) {
        try {
          await fetch(`${dgUrl}/api/${layer}/使用者`, {
            method: 'POST',
            headers,
            body: JSON.stringify(event.record),
          });
        } catch {
          // flush 失敗不影響主流程，下次 flush 會重試
        }
      }

      // flush 成功後清除 pending events
      value.pendingEvents = [];
    }
  }

  protected async onEvict(_: Map<string, AccountCacheValue>): Promise<void> {
    // 純記憶體快取，無外部資源需要釋放
  }
}

/** 全域唯一實例 */
export const accountPool = new AccountPool();