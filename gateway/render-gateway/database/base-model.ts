// 資料層基礎類別 — 所有 Model 的父類別
import { nanoid } from "nanoid";

export interface 編號 {
  _table: string;
  _type: string;
  _id: string;
}

export class 資料 {
  private 編號: 編號 = { _table: "", _type: "", _id: "" };
  public 標籤集: string[];
  public 最後修改: Date;
  public 可刪除: boolean;

  public get type() {
    return this.編號._type;
  }
  public set type(type: string) {
    this.編號._type = type;
  }
  public get table() {
    return this.編號._table;
  }
  public set table(table: string) {
    this.編號._table = table;
  }
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
    可刪除: boolean = true,
  ) {
    this.可刪除 = 可刪除;
    this.標籤集 = data?.標籤集 as string[] || [];
    this.最後修改 = data?.最後修改
      ? new Date(data.最後修改 as string)
      : new Date();
    if (typeof data?.id === "string" && data.id.length > 0) {
      this.id = data.id;
    }
    if (!this.編號._table) this.編號._table = this.constructor.name;
    if (!this.編號._type) this.編號._type = this.constructor.name;
    if (!this.編號._id) this.編號._id = nanoid(12);
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      可刪除: this.可刪除,
      標籤集: this.標籤集,
      最後修改: this.最後修改,
    };
  }
  public async 初始化(): Promise<void> {
    // 由子類別實現
  }
}
