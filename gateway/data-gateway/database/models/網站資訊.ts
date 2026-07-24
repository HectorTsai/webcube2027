/**
 * 網站資訊 — 租戶（網站）資料模型
 *
 * 實作 網站資訊介面，提供預設值與序列化。
 * 用在「新增網站」等需要建構新記錄的場合。
 *
 * 從 L2 資料庫讀取的 JSON 可直接當作 網站資訊介面 使用，
 * 不需要 new 網站資訊()。
 */

import type { 網站資訊介面, 多語字串 } from './網站資訊介面.ts';

export default class 網站資訊 implements 網站資訊介面 {
  // ── 系統欄位 ──
  public id!: string;
  public 最後修改!: string;

  // ── 核心資訊 ──
  public 網址!: string;
  public 名稱!: 多語字串;
  public 描述!: 多語字串;
  public 商標!: string;
  public 模式!: string;

  // ── 外觀 ──
  public 佈景主題!: string;
  public 配色!: string;
  public 骨架!: string;

  // ── 設定 ──
  public 設定!: Record<string, string>;
  public 主選單!: string[];

  // ── 多國語言 ──
  public 語言!: string[];
  public 預設語言!: string;

  // ── L3 資料庫 ──
  public 資料庫!: string;

  // ── 時效 ──
  public 開始日期!: string;
  public 結束日期!: string;

  constructor(data: Partial<網站資訊介面> = {}) {
    const now = new Date().toISOString();
    this.id = data.id ?? '';
    this.最後修改 = data.最後修改 ?? now;

    this.網址 = data.網址 ?? '';
    this.名稱 = data.名稱 ?? {};
    this.描述 = data.描述 ?? {};
    this.商標 = data.商標 ?? '';
    this.模式 = data.模式 ?? 'PUBLIC';

    this.佈景主題 = data.佈景主題 ?? '佈景主題/佈景主題/經典藍';
    this.配色 = data.配色 ?? '';
    this.骨架 = data.骨架 ?? '';

    this.設定 = data.設定 ?? {};
    this.主選單 = data.主選單 ?? ['頁面:頁面:home'];

    this.語言 = data.語言 ?? ['zh-tw', 'en'];
    this.預設語言 = data.預設語言 ?? 'zh-tw';

    this.資料庫 = data.資料庫 ?? '';

    this.開始日期 = data.開始日期 ?? now;
    this.結束日期 = data.結束日期 ?? now;
  }

  /** 序列化為持久化用 JSON */
  toJSON(): 網站資訊介面 {
    return {
      id: this.id,
      最後修改: this.最後修改,
      網址: this.網址,
      名稱: this.名稱,
      描述: this.描述,
      商標: this.商標,
      模式: this.模式,
      佈景主題: this.佈景主題,
      配色: this.配色,
      骨架: this.骨架,
      設定: this.設定,
      主選單: this.主選單,
      語言: this.語言,
      預設語言: this.預設語言,
      資料庫: this.資料庫,
      開始日期: this.開始日期,
      結束日期: this.結束日期,
    };
  }
}
