// /models/裝飾.ts
import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULT_VALUES = {
  名稱: { en: "none", "zh-tw": "無裝飾", vi: "không có" },
  描述: { en: "Clean canvas without ornaments", "zh-tw": "純淨畫布，無任何額外掛件", vi: "Không có trang trí" },
  
  // 🌟【萬能裝飾 Key-Value 管道】
  // 未來前端元件需要什麼掛件，直接來這裡 blind-fetch！
  // 欄位和程式碼永遠不需要為新組件動刀！
  配置: {
    "badge-top-left": "none",
    "badge-top-right": "none",
    "card-ornament": "none",
    "watermark-pattern": "none"
  },
  售價: 0
};

export default class 裝飾 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 配置: Record<string, string>; // 萬能媒體與掛件指針水庫
  public 售價: number;

  public constructor(data: Record<string, unknown> = {}, 可刪除: boolean = true) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? DEFAULT_VALUES.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? DEFAULT_VALUES.描述);
    this.配置 = (data?.配置 as Record<string, string>) ?? { ...DEFAULT_VALUES.配置 };
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      配置: this.配置,
      售價: this.售價,
    };
  }
}