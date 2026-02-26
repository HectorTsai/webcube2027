import { 權限, 資料 } from "../../database/index.ts";

export default class 標籤 extends 資料 {
  public 名稱: Record<string, string>;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super({}, 權限設定);
    this.名稱 = (data?.名稱 as Record<string, string>) ?? {};
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
    };
  }

  public static fromJSON(data: Record<string, unknown>) {
    return new 標籤(data);
  }
}
