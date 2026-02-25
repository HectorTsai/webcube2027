import { SQLModel } from "@dreamer/database";
import { 權限 } from "../../database.ts";
import { MultilingualString } from "@dui/smartmultilingual";

export default class 語言 extends SQLModel {
  public 權限: 權限;
  public 名稱: MultilingualString;
  public code: string;
  public 圖示: string;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super();
    this.權限 = 權限設定;
    this.名稱 = new MultilingualString(data?.名稱 ?? {});
    this.code = data?.code ?? "";
    this.圖示 = data?.圖示 ?? "/圖示/圖示/web_cube";
    if (data.id) this.id = data.id;
    if (data.created_at) this.created_at = new Date(data.created_at);
    if (data.updated_at) this.updated_at = new Date(data.updated_at);
  }
  public toJSON(): Record<string, any> {
    const r = super.toJSON();
    r["權限"] = this.權限;
    r["名稱"] = this.名稱;
    r["code"] = this.code;
    r["圖示"] = this.圖示;
    return r;
  }
}
