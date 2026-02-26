import { MultilingualSmartContent, SmartContent } from "@dui/smartmultilingual";
import { 權限, 版權資料, 資料 } from "../../database/index.ts";

export default class 系統資訊 extends 資料 {
  名稱: Record<string, string>;
  描述: MultilingualSmartContent;
  商標: string;
  橫幅: string;
  預設語言: string;
  資料庫: { type: string; url: string };
  版權資料: 版權資料;
  軟體服務條款: MultilingualSmartContent;
  使用者服務條款: MultilingualSmartContent;
  隱私權政策: MultilingualSmartContent;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super({}, 權限設定);
    const defaultContent: Record<string, SmartContent> = {
      "zh-tw": new SmartContent({ format: "MARKDOWN", content: "" }),
    };
    const buildContent = (value: unknown) => {
      if (value instanceof MultilingualSmartContent) return value;
      return new MultilingualSmartContent(
        (value as Record<string, SmartContent>) ?? defaultContent,
      );
    };
    this.名稱 = (data?.名稱 as Record<string, string>) ?? {};
    this.描述 = buildContent(data?.描述);
    this.軟體服務條款 = buildContent(data?.軟體服務條款);
    this.使用者服務條款 = buildContent(data?.使用者服務條款);
    this.隱私權政策 = buildContent(data?.隱私權政策);
    this.商標 = (data?.商標 as string) ?? "";
    this.橫幅 = (data?.橫幅 as string) ?? "";
    this.資料庫 = (data?.資料庫 as { type: string; url: string }) ?? { type: "KV", url: "" };
    this.預設語言 = (data?.預設語言 as string) ?? "en";
    this.版權資料 = (data?.版權資料 as 版權資料) ?? {};
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
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

  public static fromJSON(data: Record<string, unknown>) {
    return new 系統資訊(data);
  }
}
