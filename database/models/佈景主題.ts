import { SQLModel } from "@dreamer/database";
import { 權限 } from "../../database.ts";
import 多國語言字串 from "../../utils/多國語言字串.ts";

const DEFAULTS = {
  名稱: { en: "classic blue", "zh-tw": "經典藍", vi: "màu xanh cổ điển" },
  描述: {
    en: "A blue tone, giving a feeling of calm, gentleness and comfort.",
    "zh-tw": "一種藍色調，給人冷靜、柔和舒服的感覺",
    vi:
      "Một tông màu xanh, mang lại cảm giác bình tĩnh, nhẹ nhàng và thoải mái.",
  },
  配色: "",
  骨架: "",
  裝飾: {},
};

export default class 佈景主題 extends SQLModel {
  public 權限: 權限;
  public 名稱: 多國語言字串;
  public 描述: 多國語言字串;
  public 配色: string;
  public 骨架: string;
  public 裝飾: Record<string, string>;
  public 售價: number;

  public constructor(
    data: Record<string, any> = {},
    權限設定: 權限 = { 讀: true, 寫: true, 刪除: true },
  ) {
    super();
    this.權限 = 權限設定;
    this.名稱 = new 多國語言字串(data?.名稱 ?? DEFAULTS.名稱);
    this.描述 = new 多國語言字串(data?.描述 ?? DEFAULTS.描述);
    this.配色 = data?.配色 ?? DEFAULTS.配色;
    this.骨架 = data?.骨架 ?? DEFAULTS.骨架;
    this.裝飾 = data?.裝飾 ?? DEFAULTS.裝飾;
    this.售價 = data?.售價 ?? 0;
    if (data.id) this.id = data.id;
    if (data.created_at) this.created_at = new Date(data.created_at);
    if (data.updated_at) this.updated_at = new Date(data.updated_at);
  }
  public toJSON(): Record<string, any> {
    const r = super.toJSON();
    r["權限"] = this.權限;
    r["名稱"] = this.名稱;
    r["描述"] = this.描述;
    r["配色"] = this.配色;
    r["骨架"] = this.骨架;
    r["裝飾"] = this.裝飾;
    r["售價"] = this.售價;
    return r;
  }
}
