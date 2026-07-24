/**
 * 網站資訊介面 — 租戶（網站）的資料結構定義
 *
 * ── 用途 ──
 * 從 data-gateway 的 L2 (`site:config:{host}`) 取得的 JSON
 * 可直接當作 網站資訊介面 使用，不需要 new class。
 *
 * 需要建構新記錄時（如安裝流程），使用 `new 網站資訊()`。
 */

/** 單一語言的翻譯字串（多國語言物件） */
export type 多語字串 = Record<string, string>;

export interface 網站資訊介面 {
  // ── 系統欄位 ──
  /** Composite ID，格式為 site:config:{host}，如 site:config:localhost */
  id: string;
  /** 最後修改時間 ISO 字串 */
  最後修改: string;

  // ── 核心資訊 ──
  /** 網站網址（含 scheme） */
  網址: string;
  /** 網站名稱（多國語言） */
  名稱: 多語字串;
  /** 網站描述（多國語言） */
  描述: 多語字串;
  /** 商標文字 */
  商標: string;
  /** 運作模式：PUBLIC / PRIVATE */
  模式: string;

  // ── 外觀 ──
  /** 佈景主題 composite ID */
  佈景主題: string;
  /** 配色 composite ID */
  配色: string;
  /** 骨架 composite ID */
  骨架: string;

  // ── 設定 ──
  /** 一般設定（key-value） */
  設定: Record<string, string>;
  /** 主選單頁面 ID 列表 */
  主選單: string[];

  // ── 多國語言 ──
  /** 支援的語言代碼列表 */
  語言: string[];
  /** 預設語言代碼 */
  預設語言: string;

  // ── L3 資料庫 ──
  /** L3 資料庫連線資訊（AES 加密密文），存入 L2 前已加密 */
  資料庫: string;

  // ── 時效 ──
  /** 網站開始日期 ISO 字串 */
  開始日期: string;
  /** 網站結束日期 ISO 字串 */
  結束日期: string;
}
