import { MultilingualString } from "@dui/smartmultilingual";
import { 資料 } from "../index.ts";

export default class 頁面 extends 資料 {
  public 路徑: string;
  public 路徑模式?: string;          // 動態路由模式，如 "/users/{username}"
  public 標題: MultilingualString;
  public 方塊: string;              // 方塊 ID
  public 內容: any;                 // JSON 內容，支援 MultilingualString
  public 狀態: string;              // PUBLISHED, DRAFT

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    super(data, 可刪除);
    this.路徑 = (data?.路徑 as string) ?? "";
    this.路徑模式 = (data?.路徑模式 as string) ?? undefined;
    this.標題 = new MultilingualString(data?.標題 as Record<string, string> | undefined);
    this.方塊 = (data?.方塊 as string) ?? "";
    this.內容 = data?.內容 ?? {};
    this.狀態 = (data?.狀態 as string) ?? "DRAFT";
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      路徑: this.路徑,
      路徑模式: this.路徑模式,
      標題: this.標題.toJSON(),
      方塊: this.方塊,
      內容: this.內容,
      狀態: this.狀態,
    };
  }
}
