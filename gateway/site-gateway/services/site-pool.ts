/**
 * SitePool — 網站資訊快取 Pool
 *
 * 繼承 @dui/pool 的 BasePool，為 site-gateway 提供：
 *   1. 快取 L2 `網站資訊` 記錄（key = domain），減少重複打 data-gateway
 *   2. 變更延遲寫入：upsert() 先寫入 pool，onFlush 每 5 秒 batch PUT 回 L2
 *   3. 太久未讀取自動清除（maxIdleMs），避免記憶體膨脹
 *   4. 內建 getStatus()/getItemsOverview() 供 /api/health 輸出
 *
 * site-gateway 只操作 L2 的 `網站資訊` collection，無 seed。
 * L3 連線設定由 data-gateway 依網站資訊的 `資料庫` 欄位自動建立。
 */

import { BasePool } from '@dui/pool';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../utils/config.ts';

export interface SiteCacheValue {
  /** 網站資訊記錄（含 id、模式、設定、資料庫 等欄位） */
  record: Record<string, unknown>;
  /** 填入 pool 的時間戳 */
  fetchedAt: number;
}

export class SitePool extends BasePool<string, SiteCacheValue> {
  constructor() {
    super({
      maxSize: 5000,
      maxIdleMs: 10 * 60_000,    // 10 分鐘無存取 → 自動清除
      cleanupIntervalMs: 60_000, // 每 60 秒掃描過期項目
      flushIntervalMs: 5_000,    // 每 5 秒 batch flush 一次
    });
  }

  /** 產生網站資訊 composite ID */
  buildId(domain: string): string {
    return `網站資訊:網站資訊:${domain}`;
  }

  /**
   * 取得網站資訊：pool hit 直接回傳；miss 則向 data-gateway 查詢並填入 pool。
   * 回傳 null 表示網站不存在或 data-gateway 未就緒。
   */
  async getSite(domain: string): Promise<Record<string, unknown> | null> {
    const cached = this.get(domain);
    if (cached) return cached.record;

    const record = await this.fetchFromL2(domain);
    if (record) {
      this.set(domain, { record, fetchedAt: Date.now() }, false);
    }
    return record;
  }

  /**
   * 寫入（建立/更新）網站資訊：先寫入 pool 並標記 dirty，
   * 由 onFlush 週期 batch PUT 回 data-gateway L2。
   */
  upsert(domain: string, record: Record<string, unknown>): void {
    this.set(domain, { record, fetchedAt: Date.now() }, true);
  }

  /**
   * 刪除網站：先 flush 該筆 dirty 資料避免遺失，移除 pool 項目，
   * 再向 data-gateway 發送 DELETE（單筆路由 `/api/l2/:id`）。
   */
  async removeSite(domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.delete(domain); // flush dirty + onEvict + 移除 pool
    } catch {
      // 若 flush 失敗，仍嘗試刪除遠端
    }

    const dgUrl = await getDataGatewayUrl();
    const apiKey = await getDataGatewayApiKey();
    if (!dgUrl || !apiKey) {
      return { success: false, error: 'data-gateway 未就緒' };
    }

    const id = this.buildId(domain);
    try {
      const res = await fetch(
        `${dgUrl}/api/l2/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: { 'X-API-Key': apiKey },
        },
      );
      const json = await res.json();
      return json.success
        ? { success: true }
        : { success: false, error: json.error || '刪除失敗' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // ── BasePool lifecycle hooks ──

  /**
   * batch 將 dirty 網站資訊寫回 data-gateway L2。
   * 使用 0.16.0 的批次根路由 `PUT /api/l2/`（body 為 JSON 陣列，依 composite ID 自動路由）。
   * 任一筆失敗或 data-gateway 未就緒 → 拋出錯誤，讓 BasePool 保留 dirty flag 下次重試。
   */
  protected async onFlush(dirtyItems: Map<string, SiteCacheValue>): Promise<void> {
    const dgUrl = await getDataGatewayUrl();
    const apiKey = await getDataGatewayApiKey();
    if (!dgUrl || !apiKey) {
      throw new Error('data-gateway 未就緒，暫緩 flush');
    }

    const records = [...dirtyItems.values()].map((v) => v.record);
    try {
      const res = await fetch(`${dgUrl}/api/l2/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(records),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'L2 batch PUT 失敗');
      }
      // 部分失敗 → 拋出（BasePool 會保留 dirty flag，下次 flush 週期重試）
      const data = json.data as { 失敗?: string[] } | undefined;
      if (data && Array.isArray(data.失敗) && data.失敗.length > 0) {
        throw new Error(`L2 flush 部分失敗：${data.失敗.join(', ')}`);
      }
    } catch (err) {
      throw new Error(`L2 flush 失敗：${err instanceof Error ? err.message : String(err)}`);
    }
  }

  protected async onEvict(_: Map<string, SiteCacheValue>): Promise<void> {
    // 純記憶體快取，無外部資源需要釋放
  }

  // ── 內部工具 ──

  /** 向 data-gateway 查詢單筆網站資訊（filter by id） */
  private async fetchFromL2(domain: string): Promise<Record<string, unknown> | null> {
    const dgUrl = await getDataGatewayUrl();
    const apiKey = await getDataGatewayApiKey();
    if (!dgUrl || !apiKey) return null;

    const id = this.buildId(domain);
    try {
      const res = await fetch(
        `${dgUrl}/api/l2/網站資訊/網站資訊?id=${encodeURIComponent(id)}`,
        { headers: { 'X-API-Key': apiKey } },
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data[0] as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }
}

/** 全域唯一實例 */
export const sitePool = new SitePool();
