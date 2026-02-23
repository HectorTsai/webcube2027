import 多國語言字串 from "./utils/多國語言字串.ts";

export interface 權限 {
  讀?: boolean;
  寫?: boolean;
  刪除?: boolean;
}

export interface 編號 {
  _col: string;
  _type: string;
  _id: string;
}

export interface 版權資料 {
  公司?: 多國語言字串;
  網址?: string;
  開始年份?: number;
}

export const 所有資料庫: Record<string, any> = {};
