import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

export default class 語言 extends 資料 {
  public 名稱: MultilingualString;
  public code: string;
  public 圖示: string;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
    this.code = (data?.code as string) ?? "";
    this.圖示 = (data?.圖示 as string) ?? "/圖示/圖示/web_cube";
  }
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      code: this.code,
      圖示: this.圖示,
    };
  }
}
