// 排程記錄 Model — 供定時服務記錄任務最後執行時間
// host 為空 → 系統排程；有值 → 網站排程

import { 資料 } from "../index.ts";

export default class 排程記錄 extends 資料 {
  public 名稱: string;           // 任務名稱，如 "清理翻譯快取"
  public host: string | null;    // null=系統級，有值=網站級
  public 命令: string = '';       // API 路徑，如 "/api/v1/system/words/clear-expired"
  public 最後執行: Date;
  public 間隔毫秒: number;       // 多久執行一次（一次性任務為 0）
  public 循環: boolean = true;    // true=定時重複，false=只跑一次
  public 啟用: boolean;

  constructor(data: Record<string, unknown> = {}, 可刪除 = true) {
    super(data, 可刪除);
    this.名稱 = (data?.名稱 as string) ?? '';
    this.host = (data?.host as string) ?? null;
    this.命令 = (data?.命令 as string) ?? '';
    const last = data?.最後執行 as string | number | Date | undefined;
    this.最後執行 = last ? new Date(last) : new Date(0); // epoch 表示從未執行
    this.間隔毫秒 = (data?.間隔毫秒 as number) ?? 0;
    this.循環 = (data?.循環 as boolean) ?? true;
    this.啟用 = (data?.啟用 as boolean) ?? true;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      host: this.host,
      命令: this.命令,
      最後執行: this.最後執行,
      間隔毫秒: this.間隔毫秒,
      循環: this.循環,
      啟用: this.啟用,
    };
  }
}
