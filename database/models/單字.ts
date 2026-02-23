import { SQLModel } from "@dreamer/database";
import { 權限 } from "../../database.ts";
import 多國語言字串 from "../../utils/多國語言字串.ts";

export default class 單字 extends SQLModel {
  public 權限: 權限;
  public 資料: 多國語言字串;
  public 最後讀取: Date;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super();
    this.權限 = 權限設定;
    this.資料 = new 多國語言字串(data?.資料 ?? {});
    this.最後讀取 = new Date(data?.最後讀取 ?? Date.now());
    if (data.id) this.id = data.id;
    if (data.created_at) this.created_at = new Date(data.created_at);
    if (data.updated_at) this.updated_at = new Date(data.updated_at);
  }
  public toJSON(): Record<string, any> {
    const r = super.toJSON();
    r["權限"] = this.權限;
    r["資料"] = this.資料;
    r["最後讀取"] = this.最後讀取;
    return r;
  }
}
