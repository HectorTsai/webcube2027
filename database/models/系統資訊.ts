import { SQLModel } from "@dreamer/database";
import { 權限, 版權資料 } from "../../database.ts";
import { MultilingualString, MultilingualSmartContent } from "@dui/smartmultilingual";

export default class 系統資訊 extends SQLModel {
  public 權限: 權限;
  public 名稱: MultilingualString;
  public 描述: MultilingualSmartContent;
  public 商標: string;
  public 橫幅: string;
  public 預設語言: string;
  public 資料庫: { type: string; url: string };
  public 版權資料: 版權資料;
  public 軟體服務條款: MultilingualSmartContent;
  public 使用者服務條款: MultilingualSmartContent;
  public 隱私權政策: MultilingualSmartContent;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super();
    this.權限 = 權限設定;
    this.名稱 = new MultilingualString(data?.名稱 ?? {});
    this.描述 = new MultilingualSmartContent(data?.描述 ?? { "en": { format: "MARKDOWN", content: "" } });
    this.軟體服務條款 = new MultilingualSmartContent(data?.軟體服務條款 ?? { "en": {format: "MARKDOWN", content: "" } });
    this.使用者服務條款 = new MultilingualSmartContent(data?.使用者服務條款 ?? { "en": { format: "MARKDOWN", content: "" } });
    this.隱私權政策 = new MultilingualSmartContent(data?.隱私權政策 ?? { "en": { format: "MARKDOWN", content: "" } });
    this.商標 = data?.商標 ?? "";
    this.橫幅 = data?.橫幅 ?? "";
    this.資料庫 = data?.資料庫 ?? {};
    this.預設語言 = data?.預設語言 ?? "en";
    this.版權資料 = data?.版權資料 ?? {};
    if (this.版權資料?.公司) {
      this.版權資料.公司 = new MultilingualString(this.版權資料.公司);
    }
    if (data.id) this.id = data.id;
    if (data.created_at) this.created_at = new Date(data.created_at);
    if (data.updated_at) this.updated_at = new Date(data.updated_at);
  }
}
