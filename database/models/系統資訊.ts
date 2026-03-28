import {
  MultilingualSmartContent,
  MultilingualString,
  SmartContent,
} from "@dui/smartmultilingual";
import SecretString from "../secretstring.ts";
import { 版權資料, 資料 } from "../index.ts";

const DEFAULTS = {
  名稱: { en: "webcube", "zh-tw": "網站方塊", vi: "webcube" },
  描述: {"zh-tw":{"格式":"MARKDOWN","內容":"file:::docs:readme.md"}},
  主選單: ["頁面:頁面:home","頁面:頁面:about","頁面:頁面:contact"],
  佈景主題: "佈景主題:佈景主題:經典藍",
};

export default class 系統資訊 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualSmartContent;
  public 商標: string;
  public 橫幅: string;
  public 預設語言: string;
  public 密碼密鑰: SecretString;
  public 使用者: string = "";
  public 密碼: SecretString;
  public 資料庫名稱: string = "webcube";
  public 語言: string[] = ["en", "zh-tw"];
  public 配色: string = ""; // 當前配色 ID
  public 佈景主題: string = ""; // 當前佈景主題 ID
  public 骨架: string = ""; // 當前骨架 ID
  public 資料庫: SecretString;
  public 主選單: string[]; // 存放網站主選單的頁面 ID
  public 版權資料: 版權資料;
  public 軟體服務條款: MultilingualSmartContent;
  public 使用者服務條款: MultilingualSmartContent;
  public 隱私權政策: MultilingualSmartContent;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = false,
  ) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> || DEFAULTS.名稱);
    this.描述 = new MultilingualSmartContent(data?.描述 as Record<string, SmartContent | { format: string; content: string | Uint8Array; }> || DEFAULTS.描述);
    this.商標 = (data?.商標 as string) ?? "";
    this.橫幅 = (data?.橫幅 as string) ?? "";
    this.資料庫 = new SecretString({ cipherText: data?.資料庫 as string | "" });
    this.預設語言 = (data?.預設語言 as string) ?? "en";
    this.主選單 = (data?.主選單 as string[]) ?? DEFAULTS.主選單;
    this.版權資料 = new 版權資料(data?.版權資料 as 版權資料);
    this.密碼密鑰 = new SecretString({ cipherText: data?.密碼密鑰 as string });
    this.使用者 = (data?.使用者 as string) ?? "";
    this.密碼 = new SecretString({ cipherText: data?.密碼 as string });
    this.語言 = (data?.語言 as string[]) ?? ["en","zh-tw"];
    this.資料庫名稱 = (data?.資料庫名稱 as string) ?? "webcube";
    this.軟體服務條款 = new MultilingualSmartContent(data?.軟體服務條款 as Record<string, SmartContent | { format: string; content: string | Uint8Array; }> | undefined);
    this.使用者服務條款 = new MultilingualSmartContent(data?.使用者服務條款 as Record<string, SmartContent | { format: string; content: string | Uint8Array; }> | undefined);
    this.隱私權政策 = new MultilingualSmartContent(data?.隱私權政策 as Record<string, SmartContent | { format: string; content: string | Uint8Array; }> | undefined);
    this.佈景主題 = (data?.佈景主題 as string) ?? DEFAULTS.佈景主題;
    this.配色 = (data?.配色 as string) ?? "";
    this.骨架 = (data?.骨架 as string) ?? "";
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
      主選單: this.主選單,
      版權資料: this.版權資料.toJSON(),
      密碼密鑰: this.密碼密鑰.toJSON(),
      使用者: this.使用者,
      密碼: this.密碼.toJSON(),
      語言: this.語言,
      資料庫名稱: this.資料庫名稱,
      軟體服務條款: this.軟體服務條款.toJSON(),
      使用者服務條款: this.使用者服務條款.toJSON(),
      隱私權政策: this.隱私權政策.toJSON(),
      佈景主題: this.佈景主題,
      配色: this.配色,
      骨架: this.骨架,
    };
  }
}
