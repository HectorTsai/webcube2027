import { 權限, 資料 } from "../../database/index.ts";

type 圖示資料 = {
  資料: string;
  格式: string;
};

export default class 圖示 extends 資料 {
  public static 預設圖示: 圖示;
  public 名稱: Record<string, string>;
  public 資料: 圖示資料;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super({}, 權限設定);
    this.名稱 = (data?.名稱 as Record<string, string>) ?? {};
    const raw = data?.資料 as Partial<圖示資料> | undefined;
    this.資料 = {
      資料: raw?.資料 ?? "web_cube.svg",
      格式: raw?.格式 ?? "SVG",
    };
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      資料: this.資料,
    };
  }

  public static fromJSON(data: Record<string, unknown>) {
    return new 圖示(data);
  }
}
