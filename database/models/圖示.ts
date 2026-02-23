import { SQLModel } from "@dreamer/database";
import { 權限 } from "../../database.ts";
import 多國語言字串 from "../../utils/多國語言字串.ts";
import 智慧內容 from "../../utils/智慧內容.ts";

export default class 圖示 extends SQLModel {
  public static 預設圖示: 圖示;
  public 權限: 權限;
  public 名稱: 多國語言字串;
  public 資料: 智慧內容;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super();
    this.權限 = 權限設定;
    this.名稱 = new 多國語言字串(data?.名稱 ?? {});
    this.資料 = data?.資料
      ? new 智慧內容(data.資料)
      : new 智慧內容({ 格式: "SVG", 內容: "web_cube.svg" });
    if (data.id) this.id = data.id;
    if (data.created_at) this.created_at = new Date(data.created_at);
    if (data.updated_at) this.updated_at = new Date(data.updated_at);
  }
  public toJSON(): Record<string, unknown> {
    const r = super.toJSON();
    r["權限"] = this.權限;
    r["名稱"] = this.名稱;
    r["資料"] = this.資料 instanceof 智慧內容 ? this.資料.toJSON() : this.資料;
    return r;
  }
}
