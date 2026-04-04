import { MultilingualString } from "@dui/smartmultilingual";
import { nanoid } from "nanoid";


export interface 編號 {
  _table: string;
  _type: string;
  _id: string;
}

export class 版權資料 {
  public 公司: MultilingualString;
  public 網址: string = "";
  public 開始年份: number = 2000;

  constructor(data ?: Record<string,any>) {
    this.公司 = new MultilingualString(data?.公司??"");
    this.網址 = data?.網址 ?? "";
    this.開始年份 = data?.開始年份 ?? 2000;
  }

  public toJSON(): Record<string, unknown> {
    return {
      公司: this.公司.toJSON(),
      網址: this.網址,
      開始年份: this.開始年份
    };
  }
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

// 讀取一顆種子 - 處理單一 JSON 檔案
async function 讀取一顆種子(filePath: string | URL): Promise<Record<string, unknown>[]> {
  try {
    // 如果是 file:// URL，轉換為檔案路徑
    let path: string;
    if (filePath instanceof URL && filePath.protocol === 'file:') {
      path = filePath.pathname;
    } else {
      path = filePath as string;
    }
    
    const text = await Deno.readTextFile(path);
    const raw = JSON.parse(text) as Record<string, unknown>[];
    const result = Array.isArray(raw) ? raw : [raw];
    return result;
  } catch (err) {
    return [];
  }
}

// 讀取目錄種子 - 遞迴讀取目錄下的所有 JSON 檔案
async function 讀取目錄種子(currentDir: URL, model: string, 所有資料: Record<string, unknown>[], relativePath: string = ''): Promise<void> {
  for await (const entry of Deno.readDir(currentDir)) {
    if (entry.isFile && entry.name.endsWith('.json')) {
      const filePath = `./database/seeds/${model}${relativePath}/${entry.name}`;
      const 檔案資料 = await 讀取一顆種子(filePath);
      所有資料.push(...檔案資料);
    } else if (entry.isDirectory) {
      const subDirUrl = new URL(entry.name + '/', currentDir);
      await 讀取目錄種子(subDirUrl, model, 所有資料, `${relativePath}/${entry.name}`);
    }
  }
}

// 讀取種子 - 主要函數
export async function 讀取種子<T extends 資料>(model: string): Promise<T[] | null> {
  try {
    const 所有資料: Record<string, unknown>[] = [];
    
    // 1. 先檢查單一檔案 model.json
    try {
      const seedPath = `./database/seeds/${model}.json`;
      const 單一檔案資料 = await 讀取一顆種子(seedPath);
      if (單一檔案資料 && 單一檔案資料.length > 0) {
        所有資料.push(...單一檔案資料);
      }
    } catch (錯誤) {
      // 單一檔案不存在，繼續檢查目錄
    }
    
    // 2. 檢查目錄 model/ 下的所有 JSON 檔案
    try {
      const dirPath = new URL(`./seeds/${model}/`, import.meta.url);
      const dirInfo = await Deno.stat(dirPath);
      
      if (dirInfo.isDirectory) {
        await 讀取目錄種子(dirPath, model, 所有資料);
      }
    } catch (錯誤) {
      // 目錄不存在或沒有檔案
    }
    
    // 如果沒有找到任何資料，返回 null
    if (所有資料.length === 0) {
      return null;
    }
    
    // 載入模型並轉換
    try {
      const mod = await import(`./models/${model}.ts`);
      const Model = mod.default;
      
      const result = 所有資料.map((item) => {
        return new Model(item);
      });
      return result;
    } catch (modelErr) {
      console.error(`[讀取種子] 模型實例化失敗: ${model}`, modelErr);
      return null;
    }
    
  } catch (err) {
    console.error(`讀取種子失敗: ${model}`, err);
    console.error(`錯誤詳情:`, err.stack);
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
  public async 初始化(): Promise<void> {
    // 由子類別實現
  }
}
