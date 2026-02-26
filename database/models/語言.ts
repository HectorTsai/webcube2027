import { 權限, 資料 } from "../../database/index.ts";

export default class 語言 extends 資料 {
  public 名稱: Record<string, string>;
  public code: string;
  public 圖示: string;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super({}, 權限設定);
    this.名稱 = (data?.名稱 as Record<string, string>) ?? {};
    this.code = (data?.code as string) ?? "";
    this.圖示 = (data?.圖示 as string) ?? "/圖示/圖示/web_cube";
  }
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      code: this.code,
      圖示: this.圖示,
    };
  }

  public static fromJSON(data: Record<string, unknown>) {
    return new 語言(data);
  }
}
