import { 版權資料, 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";
import SecretString from "../secretstring.ts";

export default class 網站資訊 extends 資料 {
  public 網址: string;
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 商標: string;
  public 模式: string;
  public 佈景主題: string;
  public 配色: string;
  public 骨架: string;
  public 密碼密鑰: SecretString;
  public 設定: Record<string, string> = {};
  public 私密設定: Record<string, SecretString> = {};
  public 版權資料: 版權資料;
  public 語言: string[];
  public 預設語言: string;
  public 資料庫: SecretString;
  public 開始日期: Date;
  public 結束日期: Date;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    const now = new Date();
    super({}, 可刪除);
    this.網址 = (data?.網址 as string) ?? "";
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined);
    this.商標 = (data?.商標 as string) ?? "";
    this.模式 = (data?.模式 as string) ?? "PUBLIC";
    this.密碼密鑰 = new SecretString({ cipherText: data?.密碼密鑰 as string });
    this.設定 = (data?.設定 as Record<string, string>) ?? {};
    for (const [key, value] of Object.entries(data?.私密設定 ?? {})) {
      this.私密設定[key] = new SecretString({ cipherText: value as string });
    }
    this.版權資料 = (data?.版權資料 as 版權資料) ?? {};
    this.語言 = (data?.語言 as string[]) ?? ["zh-tw", "en"];
    this.預設語言 = (data?.預設語言 as string) ?? "zh-tw";
    this.資料庫 = new SecretString({ cipherText: data?.資料庫 as string | undefined });
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
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      商標: this.商標,
      模式: this.模式,
      密碼密鑰: this.密碼密鑰.toJSON(),
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

  public async 設定私密設定(key: string, plainValue: string): Promise<void> {
    if (!this.私密設定[key]) this.私密設定[key] = new SecretString();
    await this.私密設定[key].setPlainText(plainValue);
  }
}
