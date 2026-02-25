import { SQLModel } from "@dreamer/database";
import { 權限 } from "../../database.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULT_VALUES = {
  名稱: { en: "classic", "zh-tw": "經典", vi: "cổ điển" },
  描述: { en: "classic style's skeleton","zh-tw":"經典風格的骨架", vi:"Cấu trúc của phong cách cổ điển"},
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

export default class 骨架 extends SQLModel {
  public 權限: 權限;
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 影像: string;
  public 布局: string;
  public 組件: string;
  public 圖示: string;
  public 書本樣式: string;
  public 開始動畫: Record<string, string>;
  public 載入器: Record<string, string>;
  public 圓角: Record<string, string>;
  public 動畫: Record<string, string>;
  public 售價: number;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super();
    this.權限 = 權限設定;
    this.名稱 = new MultilingualString(data?.名稱 ?? DEFAULT_VALUES.名稱);
    this.描述 = new MultilingualString(data?.描述 ?? DEFAULT_VALUES.描述);
    this.影像 = (data?.影像 as string) ?? DEFAULT_VALUES.影像;
    this.布局 = (data?.布局 as string) ?? DEFAULT_VALUES.布局;
    this.組件 = (data?.組件 as string) ?? DEFAULT_VALUES.組件;
    this.圖示 = (data?.圖示 as string) ?? DEFAULT_VALUES.圖示;
    this.書本樣式 = (data?.書本樣式 as string) ?? DEFAULT_VALUES.書本樣式;
    this.開始動畫 = (data?.開始動畫 as Record<string, string>) ??
      DEFAULT_VALUES.開始動畫;
    this.載入器 = (data?.載入器 as Record<string, string>) ??
      DEFAULT_VALUES.載入器;
    this.圓角 = (data?.圓角 as Record<string, string>) ?? DEFAULT_VALUES.圓角;
    this.動畫 = (data?.動畫 as Record<string, string>) ?? DEFAULT_VALUES.動畫;
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
    if (data.id) this.id = data.id as string | number;
    if (data.created_at) {
      this.created_at = new Date(data.created_at as string | number | Date);
    }
    if (data.updated_at) {
      this.updated_at = new Date(data.updated_at as string | number | Date);
    }
  }
  public toJSON(): Record<string, any> {
    const r = super.toJSON();
    r["權限"] = this.權限;
    r["名稱"] = this.名稱;
    r["描述"] = this.描述;
    r["影像"] = this.影像;
    r["布局"] = this.布局;
    r["組件"] = this.組件;
    r["圖示"] = this.圖示;
    r["書本樣式"] = this.書本樣式;
    r["開始動畫"] = this.開始動畫;
    r["載入器"] = this.載入器;
    r["圓角"] = this.圓角;
    r["動畫"] = this.動畫;
    r["售價"] = this.售價;
    return r;
  }
}
