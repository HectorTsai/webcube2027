// 排程記錄 Model Bridge — 相容 @dui/database 新 API
import { BaseModel } from "@dui/database";
import { MultilingualString } from "@dui/smartmultilingual";

export default class 排程記錄 extends BaseModel {
  public 名稱: MultilingualString;
  public host: string | null;
  public 命令: string = "";
  public 最後執行: Date;
  public 建立時間: Date;
  public 間隔分鐘: number;
  public 循環: boolean = true;
  public 啟用: boolean;

  constructor(data: Record<string, unknown> = {}, deletable = true) {
    super(data, deletable);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
    this.host = (data?.host as string) ?? null;
    this.命令 = (data?.命令 as string) ?? "";
    const last = data?.最後執行 as string | number | Date | undefined;
    this.最後執行 = last ? new Date(last) : new Date(0);
    const created = data?.建立時間 as string | number | Date | undefined;
    this.建立時間 = created ? new Date(created) : new Date();
    this.間隔分鐘 = (data?.間隔分鐘 as number) ?? 0;
    this.循環 = (data?.循環 as boolean) ?? true;
    this.啟用 = (data?.啟用 as boolean) ?? true;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      host: this.host,
      命令: this.命令,
      最後執行: this.最後執行,
      建立時間: this.建立時間,
      間隔分鐘: this.間隔分鐘,
      循環: this.循環,
      啟用: this.啟用,
    };
  }
}
