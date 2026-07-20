import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

export type 媒體類型 = "圖片" | "影片" | "音訊" | "檔案";

export default class 媒體 extends 資料 {
  public 類型: 媒體類型;
  public 原檔網址: string;
  public 縮圖網址?: string;
  public 檔案名稱: string;
  public 描述: MultilingualString;
  public 大小: number; // bytes
  public 寬度?: number; // for image/video
  public 高度?: number; // for image/video
  public 持續時間?: number; // for video/audio, seconds
  public SHA256: string;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    super(data, 可刪除);
    this.類型 = (data?.類型 as 媒體類型) ?? "檔案";
    this.原檔網址 = (data?.原檔網址 as string) ?? "";
    this.縮圖網址 = data?.縮圖網址 as string;
    this.檔案名稱 = (data?.檔案名稱 as string) ?? "";
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined);
    this.大小 = (data?.大小 as number) ?? 0;
    this.寬度 = data?.寬度 as number;
    this.高度 = data?.高度 as number;
    this.持續時間 = data?.持續時間 as number;
    this.SHA256 = (data?.SHA256 as string) ?? "";
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      類型: this.類型,
      原檔網址: this.原檔網址,
      縮圖網址: this.縮圖網址,
      檔案名稱: this.檔案名稱,
      描述: this.描述.toJSON(),
      大小: this.大小,
      寬度: this.寬度,
      高度: this.高度,
      持續時間: this.持續時間,
      SHA256: this.SHA256,
    };
  }
}
