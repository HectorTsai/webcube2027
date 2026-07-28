// Base model class — parent class for all user-defined Models
import { nanoid } from "nanoid";

/**
 * Internal identifier used by BaseModel.
 * Contains table name, type name, and a unique record ID.
 */
export interface IdInfo {
  _table: string;
  _type: string;
  _id: string;
}

/**
 * Base model class that all user-defined models should extend.
 *
 * Provides built-in fields (id, tags, updatedAt) and
 * a composite ID format of `table:type:id`.
 *
 * @example
 * ```ts
 * class User extends BaseModel {
 *   name = "";
 *   email = "";
 * }
 * ```
 */
export class BaseModel {
  private 編號: IdInfo = { _table: "", _type: "", _id: "" };
  /** Tags attached to this record. */
  public tags: string[];
  /** Last modification timestamp. */
  public updatedAt: Date;

  /** The type component of the composite ID. */
  public get type(): string {
    return this.編號._type;
  }
  public set type(type: string) {
    this.編號._type = type;
  }
  /** The table component of the composite ID. */
  public get table(): string {
    return this.編號._table;
  }
  public set table(table: string) {
    this.編號._table = table;
  }
  /**
   * Composite ID in the format `table:type:id`.
   * Can also be set with partial formats: `type:id` or just `id`.
   */
  public get id(): string {
    return `${this.table}:${this.type}:${this.編號._id}`;
  }
  public set id(id: string) {
    const parts = id.split(":");
    if (parts.length === 1) {
      this.編號._id = parts[0];
    } else if (parts.length === 2) {
      this.編號._table = parts[0];
      this.編號._id = parts[1];
    } else {
      this.編號._table = parts[0];
      this.編號._type = parts[1];
      this.編號._id = parts.slice(2).join(":"); // 保留所有剩餘部分
    }
  }

  constructor(data: Record<string, unknown> = {}) {
    this.tags = data?.tags as string[] || data?.標籤集 as string[] || [];
    this.updatedAt = data?.updatedAt
      ? new Date(data.updatedAt as string)
      : data?.最後修改
        ? new Date(data.最後修改 as string)
        : new Date();
    if (typeof data?.id === "string" && data.id.length > 0) {
      this.id = data.id;
    }
    if (!this.編號._id) this.編號._id = nanoid(12);
  }

  /** Set the table (CollectionName) and type (ModelName) for this instance. */
  public setIdentity(table: string, type: string): void {
    if (!this.編號._table) this.編號._table = table;
    if (!this.編號._type) this.編號._type = type;
  }

  /** Serialize this model instance to a plain JSON record. */
  public toJSON(): Record<string, unknown> {
    // 1. 基礎欄位（含 getter，非 own property）
    const result: Record<string, unknown> = {
      id: this.id,
      tags: this.tags,
      updatedAt: this.updatedAt,
    };
    // 2. 動態收集子類別的 own properties（排除內部狀態）
    for (const key of Object.keys(this)) {
      if (key === '編號') continue;     // 跳過內部 IdInfo
      if (key in result) continue;      // 跳過已加入的基礎欄位
      result[key] = (this as any)[key];
    }
    return result;
  }

  /**
   * Initialization hook — called automatically during seed loading.
   * Override in subclasses to set default values or perform async setup.
   */
  public async init(): Promise<void> {
    // Implement in subclasses
  }
}
