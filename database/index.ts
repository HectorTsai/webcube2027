// database/index.ts — 資料層統一入口
// 僅做 re-export，實際邏輯在 base-model.ts 和 seed-loader.ts

import { MultilingualString } from "@dui/smartmultilingual";

// ── 基礎型別 ──
export type { 編號 } from './base-model.ts';
export { 資料 } from './base-model.ts';

// ── 種子讀取 ──
export { 讀取種子 } from './seed-loader.ts';

// ── L2 連線資訊 ──
export interface L2連線資訊 {
  主機: string;
  埠號: number;
  使用者名稱: string;
  密碼: string;
  資料庫名稱: string;
  命名空間: string;
  啟用: boolean;
}

// ── 版權資料 ──
export class 版權資料 {
  public 公司: MultilingualString;
  public 網址: string = "";
  public 開始年份: number = 2000;

  constructor(data?: Record<string, unknown>) {
    this.公司 = new MultilingualString(data?.公司 ?? "");
    this.網址 = data?.網址 ?? "";
    this.開始年份 = data?.開始年份 ?? 2000;
  }

  public toJSON(): Record<string, unknown> {
    return {
      公司: this.公司.toJSON(),
      網址: this.網址,
      開始年份: this.開始年份,
    };
  }
}

// ── 全域 DB 註冊表 ──
export const 所有資料庫: Record<string, unknown> = {};
