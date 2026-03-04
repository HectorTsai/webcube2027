import { 權限, 資料 } from "@/database/index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

export default class 單字 extends 資料 {
  public 資料: MultilingualString;
  public 最後讀取: Date;

  public constructor(data: Record<string, any> = {},權限設定: 權限 = { 讀: true, 寫: true, 刪除: true }) {
    super(data, 權限設定);
    this.資料 = new MultilingualString(data?.資料);
    const last = data?.最後讀取 as string | number | Date | undefined;
    this.最後讀取 = last ? new Date(last) : new Date();
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      資料: this.資料.toJSON(),
      最後讀取: this.最後讀取,
    };
  }
}
