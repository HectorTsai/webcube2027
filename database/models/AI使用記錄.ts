// AI使用記錄 Model — 儲存於 L3 網站資料庫
// 每次 AI 請求的 log，用於計費與統計

import { 資料 } from "../index.ts";

export default class AI使用記錄 extends 資料 {
  public 網站ID: string;
  public 使用類型: string;          // 頁面生成 / 翻譯 / 風格生成 / Cube生成 / 客服
  public provider: string;          // ollama / openai / transformer 等
  public serverID: string;          // AI伺服器 ID
  public 成功: boolean;
  public 耗時毫秒: number;
  public token數: number;           // 選用，有支援的 provider 才填
  public 錯誤訊息: string;

  constructor(data: Record<string, unknown> = {}, 可刪除 = true) {
    super(data, 可刪除);
    this.網站ID = (data?.網站ID as string) ?? "";
    this.使用類型 = (data?.使用類型 as string) ?? "";
    this.provider = (data?.provider as string) ?? "";
    this.serverID = (data?.serverID as string) ?? "";
    this.成功 = (data?.成功 as boolean) ?? false;
    this.耗時毫秒 = (data?.耗時毫秒 as number) ?? 0;
    this.token數 = (data?.token數 as number) ?? 0;
    this.錯誤訊息 = (data?.錯誤訊息 as string) ?? "";
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      網站ID: this.網站ID,
      使用類型: this.使用類型,
      provider: this.provider,
      serverID: this.serverID,
      成功: this.成功,
      耗時毫秒: this.耗時毫秒,
      token數: this.token數,
      錯誤訊息: this.錯誤訊息,
    };
  }
}
