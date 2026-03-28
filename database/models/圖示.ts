import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

type 圖示資料 = {
  資料?: string;
  內容?: string;
  格式: string;
};

export default class 圖示 extends 資料 {
  public static 預設圖示: 圖示;
  public 名稱: MultilingualString;
  public 資料: 圖示資料;

  public constructor(
    data: Record<string, unknown> = {},
    可刪除: boolean = true,
  ) {
    super({}, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
    const raw = data?.資料 as Partial<圖示資料> | undefined;
    
    // 處理檔案路徑
    let 圖示內容 = raw?.內容 ?? raw?.資料 ?? "web_cube.svg";
    if (typeof 圖示內容 === 'string' && 圖示內容.startsWith('file://')) {
      try {
        const filePath = 圖示內容.replace('file://', '');
        const fileContent = Deno.readTextFileSync(filePath);
        圖示內容 = fileContent;
      } catch (error) {
        console.error(`無法讀取圖示檔案: ${圖示內容}`, error);
        圖示內容 = "web_cube.svg"; // 預設值
      }
    }
    
    this.資料 = {
      資料: 圖示內容,
      格式: raw?.格式 ?? "SVG",
    };
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      資料: this.資料,
    };
  }
}
