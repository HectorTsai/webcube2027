import { 權限, 資料 } from "../../database/index.ts";

const DEFAULT_VALUES = {
  名稱: { en: "classic", "zh-tw": "經典", vi: "cổ điển" },
  描述: {
    en: "classic style's skeleton",
    "zh-tw": "經典風格的骨架",
    vi: "Cấu trúc của phong cách cổ điển",
  },
  影像: "",
  布局: "Classic",
  組件: "Classic",
  書本樣式: "Classic",
  圖示: "外框",
  開始動畫: { type: "內建", name: "Buildings" },
  載入器: { type: "預設", name: "spinner" },
  圓角: { "中": "0.5rem", "大": "1rem", "小": "1.9rem" },
  動畫: {
    "下拉選單.開": "animate__fadeIn",
    "下拉選單.關": "animate__fadeOut",
    "抽屜.開": "animate__fadeIn",
    "抽屜.關": "animate__fadeOut",
    "視窗.開": "animate__fadeIn",
    "視窗.關": "animate__fadeOut",
  },
  "售價": 0,
};

export default class 骨架 extends 資料 {
  public 名稱: Record<string, string>;
  public 描述: Record<string, string>;
  public 影像: string;
  public 布局: string;
  public 組件: string;
  public 圖示: string;
  public 書本樣式: string;
  public 開始動畫: Record<string, string>;
  public 載入器: Record<string, string>;
  public 圓角: Record<string, string>;
  public 動畫: Record<string, Record<string, string>>;
  public 售價: number;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super({}, 權限設定);
    this.名稱 = (data?.名稱 as Record<string, string>) ?? DEFAULT_VALUES.名稱;
    this.描述 = (data?.描述 as Record<string, string>) ?? DEFAULT_VALUES.描述;
    this.影像 = (data?.影像 as string) ?? DEFAULT_VALUES.影像;
    this.布局 = (data?.布局 as string) ?? DEFAULT_VALUES.布局;
    this.組件 = (data?.組件 as string) ?? DEFAULT_VALUES.組件;
    this.圖示 = (data?.圖示 as string) ?? DEFAULT_VALUES.圖示;
    this.書本樣式 = (data?.書本樣式 as string) ?? DEFAULT_VALUES.書本樣式;
    this.開始動畫 = (data?.開始動畫 as Record<string, string>) ?? DEFAULT_VALUES.開始動畫;
    this.載入器 = (data?.載入器 as Record<string, string>) ?? DEFAULT_VALUES.載入器;
    this.圓角 = (data?.圓角 as Record<string, string>) ?? DEFAULT_VALUES.圓角;
    this.動畫 = (data?.動畫 as Record<string, Record<string, string>>) ?? DEFAULT_VALUES.動畫;
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
  }
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      描述: this.描述,
      售價: this.售價,
      影像: this.影像,
      布局: this.布局,
      組件: this.組件,
      圖示: this.圖示,
      書本樣式: this.書本樣式,
      開始動畫: this.開始動畫,
      載入器: this.載入器,
      圓角: this.圓角,
      動畫: this.動畫,
    };
  }

  public static fromJSON(data: Record<string, unknown>) {
    return new 骨架(data);
  }
}
