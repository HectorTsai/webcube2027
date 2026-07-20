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
 * Provides built-in fields (id, tags, deletable, updatedAt) and
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
  /** Whether this record can be deleted (system defaults are non-deletable). */
  public deletable: boolean;

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
    const ids = id.split(":");
    if (ids.length === 1) {
      this.編號._id = ids[0];
      return;
    }
    if (ids.length === 2) {
      this.編號._table = ids[0];
      this.編號._id = ids[1];
      return;
    }
    this.編號._table = ids[0];
    this.編號._type = ids[1];
    this.編號._id = ids[2];
  }

  constructor(
    data: Record<string, unknown> = {},
    deletable: boolean = true,
  ) {
    this.deletable = deletable;
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
    return {
      id: this.id,
      tags: this.tags,
      updatedAt: this.updatedAt,
      deletable: this.deletable,
    };
  }

  /**
   * Initialization hook — called automatically during seed loading.
   * Override in subclasses to set default values or perform async setup.
   */
  public async init(): Promise<void> {
    // Implement in subclasses
  }
}
