/**
 * @dui/pool — TaskPool: priority queue + concurrent worker execution
 *
 * Extends PoolBase with:
 * - Multiple priority queues (configurable via options.queues)
 * - Concurrent worker execution (max/min concurrency)
 * - Auto-scaling (adjust worker count based on queue pressure)
 * - Backpressure (maxQueueSize limit with rejection)
 * - Optional data source (CachePool/DataPool → tasks receive context)
 *
 * TaskPool is NOT a storage pool — it manages task execution flow.
 * It extends PoolBase for shared timer/status/destroy infrastructure.
 */

import { PoolBase } from './pool-base.ts';
import type { TaskPoolOptions, TaskPoolStatus } from './types.ts';

// ─── Internal task entry ─────────────────────────────────

interface QueuedTask {
  id: string;
  queueName: string;
  priority: number;
  createdAt: number;
  run: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
}

// ─── Per-queue state ─────────────────────────────────────

interface QueueState {
  config: { priority: number; concurrency?: number };
  pending: QueuedTask[];
}

// ─── TaskPool ────────────────────────────────────────────

export class TaskPool extends PoolBase {
  /** Per-queue definitions and pending task lists */
  private queues = new Map<string, QueueState>();

  /** Currently executing tasks count */
  private activeWorkers = 0;

  /** Auto-adjusted concurrency ceiling (minConcurrency ~ maxConcurrency) */
  private currentMax: number;

  /** Runtime counters */
  private completedTasks = 0;
  private rejectedTasks = 0;
  private lastScaleAt = 0;

  // ── Configuration (copied from options for fast access) ──

  private maxConcurrency: number;
  private minConcurrency: number;
  private autoScale: boolean;
  private scaleUpThreshold: number;
  private scaleDownThreshold: number;
  private scaleStep: number;
  private cooldownMs: number;
  private maxQueueSize: number;
  private defaultQueue: string;
  private dataSource?: { get?(key: string): unknown | null };

  constructor(options: TaskPoolOptions) {
    // PoolBase gets cleanup interval for auto-scaling checks
    super({
      cleanupIntervalMs: options.cleanupIntervalMs ?? 5000,
    });

    // Sanity checks
    if (options.maxConcurrency < 1) {
      throw new Error('TaskPool: maxConcurrency must be >= 1');
    }

    this.maxConcurrency = options.maxConcurrency;
    this.minConcurrency = options.minConcurrency ?? Math.max(1, Math.floor(options.maxConcurrency / 4));
    this.currentMax = this.minConcurrency;
    this.autoScale = options.autoScale ?? false;
    this.scaleUpThreshold = options.scaleUpThreshold ?? 0.8;
    this.scaleDownThreshold = options.scaleDownThreshold ?? 0.3;
    this.scaleStep = options.scaleStep ?? 2;
    this.cooldownMs = options.cooldownMs ?? 30_000;
    this.maxQueueSize = options.maxQueueSize ?? 1000;
    this.defaultQueue = options.defaultQueue ?? 'default';
    this.dataSource = options.dataSource;

    // Initialize queues
    if (options.queues && Object.keys(options.queues).length > 0) {
      for (const [name, config] of Object.entries(options.queues)) {
        this.queues.set(name, {
          config: { priority: config.priority, concurrency: config.concurrency },
          pending: [],
        });
      }
    }

    // Ensure default queue exists
    if (!this.queues.has(this.defaultQueue)) {
      this.queues.set(this.defaultQueue, {
        config: { priority: 1 },
        pending: [],
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Public API
  // ═══════════════════════════════════════════════════════════

  /**
   * Execute a task. Returns a promise that resolves when the task completes.
   *
   * @param queueOrTask  Queue name (string) or task function directly
   * @param task         Task function (required if first arg is queue name)
   * @returns Promise resolving to the task's return value
   */
  async exec<T>(queueOrTask: string | ((ctx: { data?: unknown }) => Promise<T>), task?: (ctx: { data?: unknown }) => Promise<T>): Promise<T> {
    const queueName = typeof queueOrTask === 'string' ? queueOrTask : this.defaultQueue;
    const taskFn = typeof queueOrTask === 'function' ? queueOrTask : task!;

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`TaskPool: unknown queue "${queueName}"`);
    }

    // Backpressure check
    if (this.maxQueueSize > 0) {
      const totalPending = this._totalPending();
      if (totalPending >= this.maxQueueSize) {
        this.rejectedTasks++;
        throw new Error(
          `TaskPool: queue full (${totalPending}/${this.maxQueueSize}). ` +
          `Task rejected due to backpressure.`,
        );
      }
    }

    return new Promise<T>((resolve, reject) => {
      const entry: QueuedTask = {
        id: crypto.randomUUID(),
        queueName,
        priority: queue.config.priority,
        createdAt: Date.now(),
        run: async () => {
          return await taskFn({ data: this.dataSource });
        },
        resolve: resolve as (value: unknown) => void,
        reject,
      };

      queue.pending.push(entry);
      this._processQueue();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  Observability
  // ═══════════════════════════════════════════════════════════

  getStatus(): TaskPoolStatus {
    const queueDetails: TaskPoolStatus['queueDetails'] = [];
    let totalPending = 0;

    for (const [name, q] of this.queues.entries()) {
      totalPending += q.pending.length;
      queueDetails.push({
        name,
        priority: q.config.priority,
        pending: q.pending.length,
        active: this._activeForQueue(name),
        concurrency: q.config.concurrency,
      });
    }

    return {
      activeWorkers: this.activeWorkers,
      maxConcurrency: this.maxConcurrency,
      minConcurrency: this.minConcurrency,
      autoScale: this.autoScale,
      pendingTasks: totalPending,
      queueDetails,
      queuePressure: this.maxQueueSize > 0 ? totalPending / this.maxQueueSize : null,
      completedTasks: this.completedTasks,
      rejectedTasks: this.rejectedTasks,
      isCleaning: this._isCleaning,
      lastCleanupAt: this._lastCleanupAt,
      lastError: this._lastError,
    };
  }

  getCurrentSize(): number {
    return this.activeWorkers;
  }

  // ═══════════════════════════════════════════════════════════
  //  PoolBase hook overrides
  // ═══════════════════════════════════════════════════════════

  /**
   * Cleanup cycle — runs auto-scaling logic.
   */
  protected async cleanup(): Promise<void> {
    if (!this.autoScale) return;

    const now = Date.now();
    if (now - this.lastScaleAt < this.cooldownMs) return;

    const totalPending = this._totalPending();
    const pressure = this.maxConcurrency > 0 ? totalPending / this.maxConcurrency : 0;

    const scaleUpNeeded = pressure > this.scaleUpThreshold && totalPending > 0;
    const scaleDownNeeded = pressure < this.scaleDownThreshold && this.activeWorkers <= this.currentMax * 0.5;

    if (scaleUpNeeded && this.currentMax < this.maxConcurrency) {
      this.currentMax = Math.min(this.currentMax + this.scaleStep, this.maxConcurrency);
      this.lastScaleAt = now;
      this._processQueue(); // pick up newly available slots
    } else if (scaleDownNeeded && this.currentMax > this.minConcurrency) {
      this.currentMax = Math.max(this.currentMax - this.scaleStep, this.minConcurrency);
      this.lastScaleAt = now;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Internal
  // ═══════════════════════════════════════════════════════════

  /** Total pending tasks across all queues */
  private _totalPending(): number {
    let total = 0;
    for (const q of this.queues.values()) {
      total += q.pending.length;
    }
    return total;
  }

  /** Count active workers for a specific queue */
  private _activeForQueue(queueName: string): number {
    // We don't track per-queue execution, so this is approximate:
    // allocated proportionally to each queue's priority
    return Math.round(this.activeWorkers / this.queues.size);
  }

  /**
   * Dequeue the highest-priority task.
   * Within same priority, FIFO (oldest first).
   */
  private _dequeue(): QueuedTask | undefined {
    let bestQueue: string | null = null;
    let bestPriority = Infinity;

    // Find highest-priority non-empty queue
    for (const [name, q] of this.queues.entries()) {
      if (q.pending.length > 0 && q.config.priority < bestPriority) {
        // Check per-queue concurrency cap
        if (q.config.concurrency !== undefined) {
          const activeForQueue = this._activeForQueue(name);
          if (activeForQueue >= q.config.concurrency) continue;
        }
        bestQueue = name;
        bestPriority = q.config.priority;
      }
    }

    if (bestQueue) {
      return this.queues.get(bestQueue)!.pending.shift();
    }

    return undefined;
  }

  /**
   * Pull tasks from queue while under concurrency limit.
   */
  private _processQueue(): void {
    while (this.activeWorkers < this.currentMax) {
      const task = this._dequeue();
      if (!task) break; // no more pending tasks

      this.activeWorkers++;

      // Execute asynchronously
      Promise.resolve()
        .then(() => task.run())
        .then(
          (result) => {
            task.resolve(result);
            this.activeWorkers--;
            this.completedTasks++;
            this._processQueue(); // check for more work
          },
          (err) => {
            task.reject(err);
            this.activeWorkers--;
            this.completedTasks++;
            this._processQueue(); // check for more work
          },
        );
    }
  }
}