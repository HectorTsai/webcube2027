// /models/佈景主題.ts
import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULTS = {
  名稱: { en: "classic blue", "zh-tw": "經典藍", vi: "màu xanh cổ điển" },
  描述: {
    en: "A blue tone, giving a feeling of calm, gentleness and comfort.",
    "zh-tw": "一種藍色調，給人冷靜、柔和舒服的感覺",
    vi: "Một tông màu xanh, mang lại cảm giác bình tĩnh, nhẹ nhàng và thoải mái.",
  },
  佈景主題: "佈景主題:佈景主題:經典藍",
  配色: "",
  骨架: "",
  風格: "風格:風格:經典實心",   // 🌟 [全新加入] 負責全站物理材質、特效（如 glow, crystal）的風格 ID
  動畫: "動畫:動畫:基本",
  裝飾: "裝飾:裝飾:無裝飾",
};

export default class 佈景主題 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 佈景主題: string;
  public 配色: string;
  public 骨架: string;
  public 風格: string;
  public 動畫: string;
  public 裝飾: string;
  public 售價: number;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? DEFAULTS.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? DEFAULTS.描述);
    this.佈景主題 = (data?.佈景主題 as string) ?? DEFAULTS.佈景主題;
    
    // 相容舊資料欄位名稱，並錨定到最終的 配色 與 骨架 指針
    this.配色 = (data?.配色 as string) ?? (data?.配色色庫 as string) ?? DEFAULTS.配色;
    this.骨架 = (data?.骨架 as string) ?? (data?.骨架結構 as string) ?? DEFAULTS.骨架;
    this.風格 = (data?.風格 as string) ?? DEFAULTS.風格;
    this.動畫 = (data?.動畫 as string) ?? DEFAULTS.動畫;
    this.裝飾 = (data?.裝飾 as string) ?? DEFAULTS.裝飾;
    
    this.售價 = (data?.售價 as number) ?? 0;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      佈景主題: this.佈景主題,
      配色: this.配色,
      骨架: this.骨架,
      風格: this.風格,
      動畫: this.動畫,
      裝飾: this.裝飾,
      售價: this.售價,
    };
  }
}