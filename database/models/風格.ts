// /models/風格.ts
import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULT_VALUES = {
  名稱: { en: "normal", "zh-tw": "標準", vi: "tiêu chuẩn" },
  描述: { en: "Agnostic variable-driven visual effect", "zh-tw": "萬能變數驅動風格", vi: "Hiệu ứng tiêu chuẩn" },
  
  // 🌟 [完全體設計] 直接存放 CSS 變數的 Key-Value 矩陣。
  // 這裡面的所有內容，Unocss-generator 都會自動盲抓轉化為 `--theme-style-${key}`
  配置: {
    "gradient": "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%)",
    "pattern": "圖示:圖示:紋理",
    "pattern-size": "32px",
    "bg-image-compose": "var(--theme-style-pattern, none), var(--theme-style-gradient, none)", // 組合拳變數
    "border": "none",
    "shadow": "none",
    "text-color": "inherit",
    "hover-bg": "transparent",
    "hover-shadow": "none"
  },
  售價: 0
};

export default class 風格 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 配置: Record<string, string>; // 萬能 CSS 變數水庫
  public 售價: number;

  public constructor(data: Record<string, unknown> = {}, 可刪除: boolean = true) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? DEFAULT_VALUES.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? DEFAULT_VALUES.描述);
    
    // 盲載所有配置，確保未來任何人、任何 AI 擴充的 CSS 變數都能無損儲存
    this.配置 = (data?.配置 as Record<string, string>) ?? { ...DEFAULT_VALUES.配置 };
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      配置: this.配置, // 完美序列化
      售價: this.售價,
    };
  }
}