import { 資料 } from "../index.ts";
import { MultilingualString, SmartContent, SupportedFormat } from "@dui/smartmultilingual";

export default class 圖示 extends 資料 {
  public static 預設圖示: 圖示;
  public 名稱: MultilingualString;
  public 資料: SmartContent;

  public constructor(data: Record<string, unknown> = {}, 可刪除: boolean = true) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
    this.資料 = new SmartContent(data?.資料 as { format: SupportedFormat; content: string | Uint8Array<ArrayBufferLike> } | undefined);
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      資料: this.資料.toJSON(),
    };
  }

  public override async 初始化(): Promise<void> {
    await this.資料.fetchAsync();
    return;
  }
}
