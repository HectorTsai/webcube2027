import { 佈景主題,系統資訊,網站資訊,語言,配色,骨架 } from "./database/models.ts";

export default interface State {
  baseURL: string;
  host: string;
  語言: { code: 支援的語言; name: 多國語言字串 };
  可用的語言: 語言[];
  系統名稱: string;
  系統資訊: 系統資訊 | undefined;
  網站名稱: string;
  網站資訊: 網站資訊 | undefined;
  佈景主題: 佈景主題 | undefined;
  骨架: 骨架 | undefined;
  配色: 配色 | undefined;
  系統資料庫: 資料庫;
  網站資料庫: 資料庫;
}

export * from "./utils/http.ts";
export * from "./utils/智慧物件.ts";
export * from "./utils/智慧內容.ts";
export * from "./utils/資源處理器.ts";
