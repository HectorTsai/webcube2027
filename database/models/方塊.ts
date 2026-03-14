import { 權限, 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULT_VALUES = {
  名稱: { 
    en: "Cube Component", 
    "zh-tw": "方塊元件", 
    vi: "Thành phần Khối" 
  },
  描述: {
    en: "A reusable UI cube component with customizable properties",
    "zh-tw": "可重用的 UI 方塊元件，具有可自定義的屬性",
    vi: "Một thành phần khối UI có thể tái sử dụng với các thuộc tính tùy chỉnh"
  },
  分類: "佈局",
  版本: "1.0.0",
  程式碼: "",
  屬性定義: {},
  可用樣式: ["layout", "visual", "spacing", "typography", "animation"],
  使用次數: 0,
  狀態: "啟用"
};

export interface 屬性定義 {
  類型: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  必要?: boolean;
  預設值?: any;
  描述?: string;
  選項?: any[];
  驗證?: (value: any) => boolean;
}

export interface 方塊統計 {
  總數量: number;
  分類統計: Record<string, number>;
  最熱門: Array<{
    id: string;
    名稱: string;
    使用次數: number;
  }>;
  最近更新: Date;
}

export default class 方塊 extends 資料 {
  public 名稱: MultilingualString;
  public 分類: '佈局' | '內容' | '導航' | '互動';
  public 描述: MultilingualString;
  public 版本: string;
  public 程式碼: string;
  public 屬性定義: Record<string, 屬性定義>;
  public 可用樣式: string[];
  public 使用次數: number;
  public 狀態: '啟用' | '停用' | '測試中';
  public 售價: number;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super(data, 權限設定);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined);
    this.分類 = (data?.分類 as '佈局' | '內容' | '導航' | '互動') ?? DEFAULT_VALUES.分類;
    this.版本 = (data?.版本 as string) ?? DEFAULT_VALUES.版本;
    this.程式碼 = (data?.程式碼 as string) ?? DEFAULT_VALUES.程式碼;
    this.屬性定義 = (data?.屬性定義 as Record<string, 屬性定義>) ?? DEFAULT_VALUES.屬性定義;
    this.可用樣式 = (data?.可用樣式 as string[]) ?? DEFAULT_VALUES.可用樣式;
    this.使用次數 = (data?.使用次數 as number) ?? DEFAULT_VALUES.使用次數;
    this.狀態 = (data?.狀態 as '啟用' | '停用' | '測試中') ?? DEFAULT_VALUES.狀態;
    this.售價 = (data?.售價 as number) ?? 0;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      分類: this.分類,
      描述: this.描述.toJSON(),
      版本: this.版本,
      程式碼: this.程式碼,
      屬性定義: this.屬性定義,
      可用樣式: this.可用樣式,
      使用次數: this.使用次數,
      狀態: this.狀態,
      售價: this.售價,
    };
  }
}
