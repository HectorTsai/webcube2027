import { MultilingualString } from "@dui/smartmultilingual";
import { nanoid } from "nanoid";

export interface 權限 {
  讀?: boolean;
  寫?: boolean;
  刪除?: boolean;
}

export interface 編號 {
  _table: string;
  _type: string;
  _id: string;
}

export interface 版權資料 {
  公司?: MultilingualString;
  網址?: string;
  開始年份?: number;
}

export async function 讀取種子<T extends 資料>(model: string): Promise<T[] | null> {
  try {
    const text = await Deno.readTextFile(`./seeds/${model}.json`);
    const raw = JSON.parse(text) as Record<string, unknown>[];

    const mod = await import(`./models/${model}.ts`);
    const Model = mod.default;

    return raw.map((item) => new Model(item));
  } catch (_err) {
    return null;
  }
}

export const 所有資料庫: Record<string, unknown> = {};

export class 資料 {
  private 編號: 編號 = { _table: "", _type: "", _id: "" };
  public 標籤集: string[];
  public 最後修改: Date;
  權限: 權限;
  embedding?: number[];

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
      // 只有 id，保留現有 table/type
      this.編號._id = ids[0];
      return;
    }
    if (ids.length === 2) {
      // table:id，保留現有 type
      this.編號._table = ids[0];
      this.編號._id = ids[1];
      return;
    }
    // table:type:id 或更多段，取前三段
    this.編號._table = ids[0];
    this.編號._type = ids[1];
    this.編號._id = ids[2];
  }

  constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    this.權限 = 權限設定;
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
      權限: this.權限,
      標籤集: this.標籤集,
      最後修改: this.最後修改,
    };
  }
}
