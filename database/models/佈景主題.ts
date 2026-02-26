import { 權限, 資料 } from "../../database/index.ts";

const DEFAULTS = {
  名稱: { en: "classic blue", "zh-tw": "經典藍", vi: "màu xanh cổ điển" },
  描述: {
    en: "A blue tone, giving a feeling of calm, gentleness and comfort.",
    "zh-tw": "一種藍色調，給人冷靜、柔和舒服的感覺",
    vi:
      "Một tông màu xanh, mang lại cảm giác bình tĩnh, nhẹ nhàng và thoải mái.",
  },
  配色: "",
  骨架: "",
  裝飾: {},
};

export default class 佈景主題 extends 資料 {
  public 名稱: Record<string, string>;
  public 描述: Record<string, string>;
  public 配色: string;
  public 骨架: string;
  public 裝飾: Record<string, string>;
  public 售價: number;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super(data, 權限設定);
    this.名稱 = (data?.名稱 as Record<string, string>) ?? DEFAULTS.名稱;
    this.描述 = (data?.描述 as Record<string, string>) ?? DEFAULTS.描述;
    this.配色 = (data?.配色 as string) ?? DEFAULTS.配色;
    this.骨架 = (data?.骨架 as string) ?? DEFAULTS.骨架;
    this.裝飾 = (data?.裝飾 as Record<string, string>) ?? DEFAULTS.裝飾;
    this.售價 = (data?.售價 as number) ?? 0;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      描述: this.描述,
      配色: this.配色,
      骨架: this.骨架,
      裝飾: this.裝飾,
      售價: this.售價,
    };
  }

  public static fromJSON(data: Record<string, unknown>) {
    return new 佈景主題(data);
  }
}
