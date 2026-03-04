import {
  MultilingualSmartContent,
  MultilingualString,
} from "@dui/smartmultilingual";
import { 權限, 版權資料, 資料 } from "@/database/index.ts";

export default class 系統資訊 extends 資料 {
  名稱: MultilingualString;
  描述: MultilingualSmartContent;
  商標: string;
  橫幅: string;
  預設語言: string;
  資料庫: string;
  版權資料: 版權資料;
  軟體服務條款: MultilingualSmartContent;
  使用者服務條款: MultilingualSmartContent;
  隱私權政策: MultilingualSmartContent;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    const key = Deno.env?.get("SECRET_PASSWORD");
    super(data, 權限設定);
    this.名稱 = new MultilingualString(data?.名稱);
    this.描述 = new MultilingualSmartContent(data?.描述);
    this.軟體服務條款 = new MultilingualSmartContent(data?.軟體服務條款);
    this.使用者服務條款 = new MultilingualSmartContent(data?.使用者服務條款);
    this.隱私權政策 = new MultilingualSmartContent(data?.隱私權政策);
    this.商標 = (data?.商標 as string) ?? "";
    this.橫幅 = (data?.橫幅 as string) ?? "";
    this.資料庫 = data?.資料庫;
    this.預設語言 = (data?.預設語言 as string) ?? "en";
    this.版權資料 = (data?.版權資料 as 版權資料) ?? {};
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      商標: this.商標,
      橫幅: this.橫幅,
      預設語言: this.預設語言,
      資料庫: this.資料庫,
      版權資料: this.版權資料,
      軟體服務條款: this.軟體服務條款.toJSON(),
      使用者服務條款: this.使用者服務條款.toJSON(),
      隱私權政策: this.隱私權政策.toJSON(),
    };
  }
}
