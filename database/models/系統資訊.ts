import { SQLModel } from "@dreamer/database";

import 智慧物件 from "../../utils/智慧物件.ts";

import { 權限, 版權資料 } from "../../database.ts";
import 多國語言字串 from "../../utils/多國語言字串.ts";

export default class 系統資訊 extends SQLModel {
  public 權限: 權限;
  public 名稱: 多國語言字串;
  public 描述: 智慧物件;
  public 商標: string;
  public 橫幅: string;
  public 預設語言: string;
  public 資料庫: { type: string; url: string };
  public 版權資料: 版權資料;
  public 軟體服務條款: 智慧物件;
  public 使用者服務條款: 智慧物件;
  public 隱私權政策: 智慧物件;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super();
    this.權限 = 權限設定;
    this.名稱 = new 多國語言字串(data?.名稱 ?? {});
    this.描述 = new 智慧物件(
      data?.描述 ?? { "zh-tw": { 格式: "MARKDOWN", 內容: "" } },
    );
    this.軟體服務條款 = new 智慧物件(
      data?.軟體服務條款 ?? { 格式: "MARKDOWN", 內容: "" },
    );
    this.使用者服務條款 = new 智慧物件(
      data?.使用者服務條款 ?? { "zh-tw": { 格式: "MARKDOWN", 內容: "" } },
    );
    this.隱私權政策 = new 智慧物件(
      data?.隱私權政策 ?? { "zh-tw": { 格式: "MARKDOWN", 內容: "" } },
    );
    this.商標 = data?.商標 ?? "";
    this.橫幅 = data?.橫幅 ?? "";
    this.資料庫 = data?.資料庫 ?? {};
    this.預設語言 = data?.預設語言 ?? "en";
    this.版權資料 = data?.版權資料 ?? {};
    if (this.版權資料?.公司) {
      this.版權資料.公司 = new 多國語言字串(this.版權資料.公司);
    }
    if (data.id) this.id = data.id;
    if (data.created_at) this.created_at = new Date(data.created_at);
    if (data.updated_at) this.updated_at = new Date(data.updated_at);
  }
}
