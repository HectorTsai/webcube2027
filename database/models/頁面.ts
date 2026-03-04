import { MultilingualString } from "@dui/smartmultilingual";
import { 權限, 資料 } from "@/database/index.ts";

export default class 頁面 extends 資料 {
  public 路徑: string;
  public 標題: MultilingualString;
  public 描述: MultilingualString;
  public 內容: string[];  // 內容 ID 陣列
  public 佈局: string;    // 佈局 ID
  public 狀態: string;    // PUBLISHED, DRAFT, etc.
  public 順序: number;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super(data, 權限設定);
    this.路徑 = (data?.路徑 as string) ?? "";
    this.標題 = new MultilingualString(data?.標題 as Record<string, string> | undefined);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined);
    this.內容 = (data?.內容 as string[]) ?? [];
    this.佈局 = (data?.佈局 as string) ?? "";
    this.狀態 = (data?.狀態 as string) ?? "DRAFT";
    this.順序 = (data?.順序 as number) ?? 0;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      路徑: this.路徑,
      標題: this.標題.toJSON(),
      描述: this.描述.toJSON(),
      內容: this.內容,
      佈局: this.佈局,
      狀態: this.狀態,
      順序: this.順序,
    };
  }
}
