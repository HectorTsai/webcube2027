import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULT_VALUES = {
  名稱: { en: "classic", "zh-tw": "經典", vi: "cổ điển" },
  描述: {
    en: "classic style's skeleton", // TODO: 翻譯
    "zh-tw": "經典風格的骨架", // TODO: 翻譯
    vi: "Cấu trúc của phong cách cổ điển", // TODO: 翻譯
  },
  影像: "",
  佈局: "方塊:方塊:cube-網站-經典",
  風格: { "default": "solid" },
  選單按鈕:"圖示:圖示:menu",
  書本樣式: "經典",
  圖示: "外框",
  開始動畫: "Buildings",
  載入器: "loading-dot",
  圓角: { "sm": "0.25rem", "md": "0.5rem", "lg": "1rem", "avatar": "999rem" },
  空間: {
    "xs": "0.5rem",
    "sm": "0.75rem", 
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem",
    "2xl": "3rem"
  },
  字型: {
    "xs": "0.75rem",
    "sm": "0.875rem",
    "base": "1rem",
    "lg": "1.125rem",
    "xl": "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem"
  },
  行高: {
    "xs": "1rem",
    "sm": "1.25rem",
    "base": "1.5rem",
    "lg": "1.75rem",
    "xl": "1.75rem",
    "2xl": "2rem",
    "3xl": "2.25rem"
  },
  陰影: {
    "none": "0 0 0 0 rgba(0, 0, 0, 0)",
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
  },
  動畫: {
    "下拉選單.開": "animate__fadeIn",
    "下拉選單.關": "animate__fadeOut",
    "抽屜.開": "animate__fadeIn",
    "抽屜.關": "animate__fadeOut",
    "視窗.開": "animate__fadeIn",
    "視窗.關": "animate__fadeOut",
  },
  圖示尺寸: {
    xs: '1rem',
    sm: '1.25rem',
    md: '1.5rem', 
    lg: '1.75rem',
    xl: '2.5rem'
  },
  "售價": 0,
};

export default class 骨架 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 影像: string;
  public 佈局: string;
  public 風格: Record<string, string>; // 風格配置
  public 圖示: string;
  public 書本樣式: string;
  public 選單按鈕:string;
  public 開始動畫: string;
  public 載入器: string;
  public 圓角: Record<string, string>;
  public 空間: Record<string, string>;
  public 字型: Record<string, string>;
  public 行高: Record<string, string>;
  public 陰影: Record<string, string>;
  public 動畫: Record<string, Record<string, string>>;
  public 圖示尺寸:Record<string, string>;
  public 售價: number;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? DEFAULT_VALUES.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? DEFAULT_VALUES.描述);
    this.影像 = (data?.影像 as string) ?? DEFAULT_VALUES.影像;
    this.佈局 = (data?.佈局 as string) ?? DEFAULT_VALUES.佈局;
    this.風格 = (data?.風格 as Record<string, string>) ?? DEFAULT_VALUES.風格;
    this.圖示 = (data?.圖示 as string) ?? DEFAULT_VALUES.圖示;
    this.選單按鈕 = (data?.選單按鈕 as string) ?? DEFAULT_VALUES.選單按鈕;
    this.書本樣式 = (data?.書本樣式 as string) ?? DEFAULT_VALUES.書本樣式;
    this.開始動畫 = (data?.開始動畫 as string) ?? DEFAULT_VALUES.開始動畫;
    this.載入器 = (data?.載入器 as string) ?? DEFAULT_VALUES.載入器;
    this.圓角 = (data?.圓角 as Record<string, string>) ?? DEFAULT_VALUES.圓角;
    this.空間 = (data?.空間 as Record<string, string>) ?? DEFAULT_VALUES.空間;
    this.字型 = (data?.字型 as Record<string, string>) ?? DEFAULT_VALUES.字型;
    this.行高 = (data?.行高 as Record<string, string>) ?? DEFAULT_VALUES.行高;
    this.陰影 = (data?.陰影 as Record<string, string>) ?? DEFAULT_VALUES.陰影;
    this.動畫 = (data?.動畫 as Record<string, Record<string, string>>) ??
      DEFAULT_VALUES.動畫;
    this.圖示尺寸 = (data?.圖示尺寸 as Record<string, string>) ?? DEFAULT_VALUES.圖示尺寸;
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
  }
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      影像: this.影像,
      佈局: this.佈局,
      風格: this.風格,
      圖示: this.圖示,
      選單按鈕: this.選單按鈕,
      書本樣式: this.書本樣式,
      開始動畫: this.開始動畫,
      載入器: this.載入器,
      圓角: this.圓角,
      空間: this.空間,
      字型: this.字型,
      行高: this.行高,
      陰影: this.陰影,
      動畫: this.動畫,
      圖示尺寸: this.圖示尺寸,
      售價: this.售價,
    };
  }
}
