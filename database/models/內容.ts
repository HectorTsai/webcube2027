import { MultilingualString } from "@dui/smartmultilingual";
import { 權限, 資料 } from "@/database/index.ts";

export type 內容類型 = "文字" | "圖片" | "影片" | "音訊" | "連結" | "區塊";

export default class 內容 extends 資料 {
  public 類型: 內容類型;
  public 標題: MultilingualString;
  public 資料: Record<string, unknown>; // 依類型不同，如 文字: {內容: MultilingualString}, 圖片: {網址: string, 描述: string}
  public 順序: number;

  public constructor(data: Record<string, unknown> = {},權限設定: 權限 = { 讀: true, 寫: true, 刪除: true }) {
    super(data, 權限設定);
    this.類型 = (data?.類型 as 內容類型) ?? "文字";
    this.標題 = new MultilingualString(data?.標題 as Record<string, string> | undefined);
    this.資料 = (data?.資料 as Record<string, unknown>) ?? {};
    this.順序 = (data?.順序 as number) ?? 0;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      類型: this.類型,
      標題: this.標題.toJSON(),
      資料: this.資料,
      順序: this.順序,
    };
  }
}
