import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";


export default class 標籤 extends 資料 {
  public 名稱: MultilingualString;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
    };
  }
}
