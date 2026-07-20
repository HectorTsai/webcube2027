// AI對話 Model — 儲存於 L3 網站資料庫
// 記錄所有 AI 對話歷史（頁面生成、翻譯、風格、Cube、客服）

import { 資料 } from "../index.ts";

export type AI對話類型 = "頁面生成" | "翻譯" | "風格生成" | "Cube生成" | "佈景主題生成" | "客服";

export interface 對話訊息 {
  角色: "user" | "assistant";
  內容: string;
  時間: string;                     // ISO string
}

export default class AI對話 extends 資料 {
  public 類型: AI對話類型;
  public 網站ID: string;
  public 標題: string;
  public 對話記錄: 對話訊息[];
  public 摘要: string;              // AI 生成摘要，列表顯示用

  constructor(data: Record<string, unknown> = {}, 可刪除 = true) {
    super(data, 可刪除);
    this.類型 = (data?.類型 as AI對話類型) ?? "客服";
    this.網站ID = (data?.網站ID as string) ?? "";
    this.標題 = (data?.標題 as string) ?? "";
    this.對話記錄 = (data?.對話記錄 as 對話訊息[]) ?? [];
    this.摘要 = (data?.摘要 as string) ?? "";
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      類型: this.類型,
      網站ID: this.網站ID,
      標題: this.標題,
      對話記錄: this.對話記錄,
      摘要: this.摘要,
    };
  }

  /** 新增一則訊息 */
  public 新增訊息(角色: "user" | "assistant", 內容: string): void {
    this.對話記錄.push({
      角色,
      內容,
      時間: new Date().toISOString(),
    });
  }
}
