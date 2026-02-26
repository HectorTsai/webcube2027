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
  公司?: Record<string, string>;
  網址?: string;
  開始年份?: number;
}

export const 所有資料庫: Record<string, unknown> = {};

export class 資料 {
  權限: 權限;

  constructor(_data: Record<string, unknown> = {}, 權限設定: 權限 = { 讀: true, 寫: true, 刪除: true }) {
    this.權限 = 權限設定;
  }

  toJSON(): Record<string, unknown> {
    return { 權限: this.權限 };
  }
}
