import { SQLModel } from "@dreamer/database";
import { 權限, 版權資料 } from "../../database.ts";
import 多國語言字串 from "../../utils/多國語言字串.ts";

export default class 網站資訊 extends SQLModel {
  public 權限: 權限;
  public 網址: string;
  public 名稱: 多國語言字串;
  public 描述: 多國語言字串;
  public 商標: string;
  public 模式: Record<string, string>;
  public 佈景主題: string;
  public 配色: string;
  public 骨架: string;
  public 設定: Record<string, any>;
  public 私密設定: Record<string, any> = {};
  public 版權資料: 版權資料;
  public 語言: string[];
  public 預設語言: string;
  public 資料庫: { type: string; url: string };
  public 開始日期: Date;
  public 結束日期: Date;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super();
    this.權限 = 權限設定;
    this.網址 = data?.網址 ?? "";
    this.名稱 = new 多國語言字串(data?.名稱 ?? {});
    this.描述 = new 多國語言字串(data?.描述 ?? {});
    this.商標 = data?.商標 ?? "";
    this.模式 = data?.模式 ?? "PUBLIC";
    this.設定 = data?.設定 ?? {};
    this.私密設定 = {}; // 簡化處理
    this.版權資料 = data?.版權資料 || {};
    if (this.版權資料?.公司) {
      this.版權資料.公司 = new 多國語言字串(this.版權資料.公司);
    }
    this.語言 = data?.語言 || ["zh-tw", "en"];
    this.預設語言 = data?.預設語言 || "zh-tw";
    this.資料庫 = {
      type: data?.資料庫?.type || "MONGO",
      url: data?.資料庫?.url || "",
    };
    this.開始日期 = data?.開始日期 || new Date();
    this.結束日期 = data?.結束日期 || new Date();
    this.佈景主題 = data?.佈景主題 || "佈景主題/佈景主題/經典藍";
    this.配色 = data?.配色 || "";
    this.骨架 = data?.骨架 || "";
    if (data.id) this.id = data.id;
    if (data.created_at) this.created_at = new Date(data.created_at);
    if (data.updated_at) this.updated_at = new Date(data.updated_at);
  }
  public toJSON(): Record<string, any> {
    const r = super.toJSON();
    r["權限"] = this.權限;
    r.網址 = this.網址;
    r.名稱 = this.名稱;
    r.描述 = this.描述;
    r.商標 = this.商標;
    r.模式 = this.模式;
    r.設定 = this.設定;
    r.私密設定 = this.私密設定;
    r.版權資料 = this.版權資料;
    r.語言 = this.語言;
    r.預設語言 = this.預設語言;
    r.資料庫 = this.資料庫;
    r.開始日期 = this.開始日期;
    r.結束日期 = this.結束日期;
    r.佈景主題 = this.佈景主題;
    r.配色 = this.配色;
    r.骨架 = this.骨架;
    return r;
  }
}
