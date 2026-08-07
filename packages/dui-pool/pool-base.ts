/**
 * @dui/pool — Abstract pool base class
 *
 * Shared infrastructure for all pool types:
 * - Timer management (cleanup, heartbeat)
 * - Lifecycle hooks (cleanup, onHeartbeat)
 * - Observability (guards, timestamps, error tracking)
 * - Destroy / reconfigure lifecycle
 *
 * Subclasses implement the abstract cleanup() hook and getCurrentSize().
 */

import type { PoolBaseOptions } from './types.ts';
import { error as logError } from '@dui/util';

// ─── PoolBase ───────────────────────────────────────────

export abstract class PoolBase {
  protected cleanupTimer?: ReturnType<typeof setInterval>;
  protected heartbeatTimer?: ReturnType<typeof setInterval>;

  /** Guards against overlapping cleanup cycles */
  protected _isCleaning = false;
  /** Guards against overlapping heartbeat cycles */
  protected _isHeartbeating = false;

  // ── Observability counters ──────────────────────────

  protected _evictions = 0;
  protected _lastCleanupAt: number | null = null;
  protected _lastHeartbeatAt: number | null = null;
  protected _lastError: { time: number; message: string } | null = null;

  constructor(protected options: PoolBaseOptions = {}) {
    this._startCleanupTimer();
    this._startHeartbeatTimer();
  }

  // ═══════════════════════════════════════════════════════
  //  Timers
  // ═══════════════════════════════════════════════════════

  private _startCleanupTimer(): void {
    const ms = this.options.cleanupIntervalMs;
    if (!ms || ms <= 0) return;

    this.cleanupTimer = setInterval(async () => {
      if (this._isCleaning) return;
      this._isCleaning = true;
      try {
        await this.cleanup();
        this._lastCleanupAt = Date.now();
      } catch (err) {
        this._lastError = { time: Date.now(), message: `cleanup: ${err}` };
        logError('PoolBase', `Cleanup error: ${err}`);
      } finally {
        this._isCleaning = false;
      }
    }, ms);
  }

  private _startHeartbeatTimer(): void {
    const ms = this.options.heartbeatIntervalMs;
    if (!ms || ms <= 0) return;

    this.heartbeatTimer = setInterval(async () => {
      if (this._isHeartbeating) return;
      this._isHeartbeating = true;
      try {
        await this.onHeartbeat();
        this._lastHeartbeatAt = Date.now();
      } catch (err) {
        this._lastError = { time: Date.now(), message: `heartbeat: ${err}` };
        logError('PoolBase', `Heartbeat error: ${err}`);
      } finally {
        this._isHeartbeating = false;
      }
    }, ms);
  }

  // ═══════════════════════════════════════════════════════
  //  Public API
  // ═══════════════════════════════════════════════════════

  /**
   * Update configuration at runtime.
   * Note: timer interval changes only take effect after destroy+recreate.
   */
  reconfigure(options: Partial<PoolBaseOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Destroy the pool. Stops all timers, waits for running cycles to finish.
   */
  async destroy(): Promise<void> {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    while (this._isCleaning || this._isHeartbeating) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  // ═══════════════════════════════════════════════════════
  //  Subclass hooks
  // ═══════════════════════════════════════════════════════

  /**
   * Called periodically if cleanupIntervalMs is configured.
   * Subclasses implement their cleanup / eviction / auto-scale logic here.
   */
  protected abstract cleanup(): Promise<void>;

  /**
   * Called periodically if heartbeatIntervalMs is configured.
   * Optional — subclass may override.
   */
  protected async onHeartbeat(): Promise<void> {
    // optional
  }

  /**
   * Report current number of managed items/workers.
   * Used by subclasses for status reporting.
   */
  abstract getCurrentSize(): number;

  // ═══════════════════════════════════════════════════════
  //  Utilities
  // ═══════════════════════════════════════════════════════

  /**
   * Format a key for human-readable display.
   */
  protected formatKey(key: unknown): string {
    if (typeof key === 'object' && key !== null) {
      try {
        return JSON.stringify(key);
      } catch {
        return String(key);
      }
    }
    return String(key);
  }
}