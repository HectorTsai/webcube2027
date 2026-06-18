// /models/骨架.ts
import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULT_VALUES = {
  名稱: { en: "classic", "zh-tw": "經典", vi: "cổ điển" },
  描述: { en: "Agnostic layout skeleton", "zh-tw": "萬能變數驅動骨架", vi: "Cấu trúc cổ điển" },
  影像: "",
  佈局: "方塊:方塊:基礎佈局",
  圖示: "外框", 
  書本樣式: "經典",
  選單按鈕: "圖示:圖示:選單",
  開始動畫: "Buildings",
  載入器: "spinner",
  
  // 🌟【終極幾何 Token 水庫】完全吞吐你追加的超巨型與超微型排版 Token
  配置: {
    // 圓角家族
    "radius-sm": "0.25rem", "radius-md": "0.5rem", "radius-lg": "1rem", "radius-avatar": "999rem",
    
    // 間距家族
    "spacing-xs": "0.5rem", "spacing-sm": "0.75rem", "spacing-md": "1rem", "spacing-lg": "1.5rem", "spacing-xl": "2rem", "spacing-2xl": "3rem",
    
    // 🔤 文字字型家族（追加 5xl, 9xl 巨型標題支援）
    "font-xs": "0.75rem", "font-sm": "0.875rem", "font-base": "1rem", "font-lg": "1.125rem", "font-xl": "1.25rem", "font-2xl": "1.5rem", "font-3xl": "1.875rem",
    "font-5xl": "3rem",
    "font-9xl": "8rem",
    
    // 行高家族（對齊文字追加）
    "leading-xs": "1rem", "leading-sm": "1.25rem", "leading-base": "1.5rem", "leading-lg": "1.75rem", "leading-xl": "1.75rem", "leading-2xl": "2rem", "leading-3xl": "2.25rem",
    "leading-5xl": "1",
    "leading-9xl": "1",
    
    "border-sm": "1px",
    "border-md": "1.5px",
    "border-lg": "3px",
    
    // 🔮 圖示家族（追加 xs 超小尺寸）
    "icon-xs": "12px",
    "icon-sm": "16px",
    "icon-md": "24px",
    "icon-lg": "32px",
    
    // 🖼️ 圖片家族（追加 xl, 2xl, 3xl, 5xl, 9xl 巨型圖像支援）
    "image-sm": "48px",
    "image-md": "96px",
    "image-lg": "192px",
    "image-xl": "256px",
    "image-2xl": "384px",
    "image-3xl": "512px",
    "image-5xl": "768px",
    "image-9xl": "1024px"
  },
  售價: 0
};

export default class 骨架 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 影像: string;
  public 佈局: string;
  public 圖示: string;
  public 書本樣式: string;
  public 選單按鈕: string;
  public 開始動畫: string;
  public 載入器: string;
  public 配置: Record<string, string>; // 萬能幾何變數通道（滿血版）
  public 售價: number;

  public constructor(data: Record<string, unknown> = {}, 可刪除: boolean = true) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? DEFAULT_VALUES.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? DEFAULT_VALUES.描述);
    this.影像 = (data?.影像 as string) ?? DEFAULT_VALUES.影像;
    this.佈局 = (data?.佈局 as string) ?? DEFAULT_VALUES.佈局;
    this.圖示 = (data?.圖示 as string) ?? DEFAULT_VALUES.圖示;
    this.書本樣式 = (data?.書本樣式 as string) ?? DEFAULT_VALUES.書本樣式;
    this.選單按鈕 = (data?.選單按鈕 as string) ?? DEFAULT_VALUES.選單按鈕;
    this.開始動畫 = (data?.開始動畫 as string) ?? (data?.開始動畫 as any)?.name ?? DEFAULT_VALUES.開始動畫;
    this.載入器 = (data?.載入器 as string) ?? (data?.載入器 as any)?.name ?? DEFAULT_VALUES.載入器;
    
    this.配置 = (data?.配置 as Record<string, string>) ?? { ...DEFAULT_VALUES.配置 };
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      影像: this.影像,
      佈局: this.佈局,
      圖示: this.圖示,
      書本樣式: this.書本樣式,
      選單按鈕: this.選單按鈕,
      開始動畫: this.開始動畫,
      載入器: this.載入器,
      配置: this.配置,
      售價: this.售價,
    };
  }
}