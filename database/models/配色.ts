import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const _DEFAULT_STRINGS = {
  名稱: { en: "classic blue", "zh-tw": "經典藍", vi: "màu xanh cổ điển" },
  描述: {
    en: "A blue tone, giving a feeling of calm, gentleness and comfort.",
    "zh-tw": "一種藍色調，給人冷靜、柔和舒服的感覺",
    vi: "Một tông màu xanh, mang lại cảm giác bình tĩnh, nhẹ nhàng và thoải mái.",
  },
};

const DEFAULT_COLORS = {
  主色: "59.67% 0.221 258.03",        // --p
  次色: "39.24% 0.128 255",            // --s
  強調色: "77.86% 0.1489 226.0173",    // --a
  中性色: "35.5192% .032071 262.988584", // --nc
  背景色: "100% 0 0",                    // --b1
  資訊色: "71.17% 0.166 241.15",       // --info
  成功色: "60.9% 0.135 161.2",         // --success
  警告色: "73% 0.19 52",               // --warning
  錯誤色: "57.3% 0.234 28.28",        // --error
};

export default class 配色 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 主色: string;
  public 次色: string;
  public 強調色: string;
  public 中性色: string;
  public 背景色: string;
  public 資訊色: string;
  public 成功色: string;
  public 警告色: string;
  public 錯誤色: string;
  public 售價: number;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? _DEFAULT_STRINGS.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? _DEFAULT_STRINGS.描述);
    this.主色 = (data?.主色 as string) ?? DEFAULT_COLORS.主色;
    this.次色 = (data?.次色 as string) ?? DEFAULT_COLORS.次色;
    this.強調色 = (data?.強調色 as string) ?? DEFAULT_COLORS.強調色;
    this.中性色 = (data?.中性色 as string) ?? DEFAULT_COLORS.中性色;
    this.背景色 = (data?.背景色 as string) ?? DEFAULT_COLORS.背景色;
    this.資訊色 = (data?.資訊色 as string) ?? DEFAULT_COLORS.資訊色;
    this.成功色 = (data?.成功色 as string) ?? DEFAULT_COLORS.成功色;
    this.警告色 = (data?.警告色 as string) ?? DEFAULT_COLORS.警告色;
    this.錯誤色 = (data?.錯誤色 as string) ?? DEFAULT_COLORS.錯誤色;
    this.售價 = (data?.售價 as number) ?? 0;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      主色: this.主色,
      次色: this.次色,
      強調色: this.強調色,
      中性色: this.中性色,
      背景色: this.背景色,
      資訊色: this.資訊色,
      成功色: this.成功色,
      警告色: this.警告色,
      錯誤色: this.錯誤色,
      售價: this.售價,
    };
  }
}
