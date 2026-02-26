import { 權限, 版權資料, 資料 } from "../../database/index.ts";

export default class 網站資訊 extends 資料 {
  public 網址: string;
  public 名稱: Record<string, string>;
  public 描述: Record<string, string>;
  public 商標: string;
  public 模式: string;
  public 佈景主題: string;
  public 配色: string;
  public 骨架: string;
  public 設定: Record<string, unknown>;
  public 私密設定: Record<string, unknown> = {};
  public 版權資料: 版權資料;
  public 語言: string[];
  public 預設語言: string;
  public 資料庫: { type: string; url: string };
  public 開始日期: Date;
  public 結束日期: Date;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    const now = new Date();
    super({}, 權限設定);
    this.網址 = (data?.網址 as string) ?? "";
    this.名稱 = (data?.名稱 as Record<string, string>) ?? {};
    this.描述 = (data?.描述 as Record<string, string>) ?? {};
    this.商標 = (data?.商標 as string) ?? "";
    this.模式 = (data?.模式 as string) ?? "PUBLIC";
    this.設定 = (data?.設定 as Record<string, unknown>) ?? {};
    this.私密設定 = (data?.私密設定 as Record<string, unknown>) ?? {};
    this.版權資料 = (data?.版權資料 as 版權資料) ?? {};
    this.語言 = (data?.語言 as string[]) ?? ["zh-tw", "en"];
    this.預設語言 = (data?.預設語言 as string) ?? "zh-tw";
    this.資料庫 = (data?.資料庫 as { type: string; url: string }) ?? { type: "KV", url: "" };
    this.開始日期 = (data?.開始日期 as Date) ?? now;
    this.結束日期 = (data?.結束日期 as Date) ?? now;
    this.佈景主題 = (data?.佈景主題 as string) ?? "佈景主題/佈景主題/經典藍";
    this.配色 = (data?.配色 as string) ?? "";
    this.骨架 = (data?.骨架 as string) ?? "";
  }
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      網址: this.網址,
      名稱: this.名稱,
      描述: this.描述,
      商標: this.商標,
      模式: this.模式,
      設定: this.設定,
      私密設定: this.私密設定,
      版權資料: this.版權資料,
      語言: this.語言,
      預設語言: this.預設語言,
      資料庫: this.資料庫,
      開始日期: this.開始日期,
      結束日期: this.結束日期,
      佈景主題: this.佈景主題,
      配色: this.配色,
      骨架: this.骨架,
    };
  }

  public static fromJSON(data: Record<string, unknown>) {
    return new 網站資訊(data);
  }
}
