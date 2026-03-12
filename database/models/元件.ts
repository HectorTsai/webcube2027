import { 權限, 資料 } from "../index.ts";

export default class 元件 extends 資料 {
  public 名稱: string;
  public 代碼: string;
  public 版本: string;
  public 審核通過: boolean;
  public 審核者: string;
  public 審核備註: string;
  public 更新時間: Date;

  public constructor(
    data: Record<string, unknown> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super(data, 權限設定);
    this.名稱 = (data?.名稱 as string) ?? "";
    this.代碼 = (data?.代碼 as string) ?? "";
    this.版本 = (data?.版本 as string) ?? "1.0.0";
    this.審核通過 = (data?.審核通過 as boolean) ?? false;
    this.審核者 = (data?.審核者 as string) ?? "";
    this.審核備註 = (data?.審核備註 as string) ?? "";
    this.更新時間 = (data?.更新時間 as Date) ?? new Date();
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      代碼: this.代碼,
      版本: this.版本,
      審核通過: this.審核通過,
      審核者: this.審核者,
      審核備註: this.審核備註,
      更新時間: this.更新時間,
    };
  }
}
