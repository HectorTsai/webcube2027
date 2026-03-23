import { MultilingualString } from "@dui/smartmultilingual";
import { nanoid } from "nanoid";


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

// L2 資料庫連線資訊
export interface L2連線資訊 {
  主機: string;
  埠號: number;
  使用者名稱: string;
  密碼: string;
  資料庫名稱: string;
  命名空間: string;
  啟用: boolean;
}

export async function 讀取種子<T extends 資料>(model: string): Promise<T[] | null> {
  try {
    const seedPath = new URL(`./seeds/${model}.json`, import.meta.url);
    const text = await Deno.readTextFile(seedPath);
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
  public 可刪除: boolean;
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
}
