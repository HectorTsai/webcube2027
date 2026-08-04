/**
 * 網站資訊 — 租戶（網站）資料模型
 *
 * 實作 網站資訊介面，提供預設值與序列化。
 * 用在「新增網站」等需要建構新記錄的場合。
 *
 * 從 L2 資料庫讀取的 JSON 可直接當作 網站資訊介面 使用，
 * 不需要 new 網站資訊()。
 *
 * ── 持有人 ──
 * site-gateway
 */

import { BaseModel, BaseModelInterface } from "@dui/database/base-model";
import { MultilingualString } from "@dui/smartmultilingual";

export interface 網站資訊介面 extends BaseModelInterface {
  // ── 核心資訊 ──
  /** 網站網址（僅 hostname，不含協定與埠號），如 localhost、example.com */
  網址: string;
  /** 網站名稱（多國語言） */
  名稱: MultilingualString;
  /** 網站描述（多國語言） */
  描述: MultilingualString;
  /** 商標文字 */
  商標: string;
  /** 運作模式：PUBLIC / PRIVATE / REDIRECT / MIRROR */
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
  /** L3 資料庫連線資訊（AES 加密密文），REDIRECT / MIRROR 模式此欄位為空 */
  資料庫: string;

  // ── 時效 ──
  /** 網站開始日期 ISO 字串 */
  開始日期: string;
  /** 網站結束日期 ISO 字串 */
  結束日期: string;

  作者: string;
}

export default class 網站資訊 extends BaseModel implements 網站資訊介面 {
  // ── 核心資訊 ──
  public 網址!: string;
  public 名稱!: MultilingualString;
  public 描述!: MultilingualString;
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

  public 作者!: string;

  constructor(data: Partial<網站資訊介面> = {}) {
    super(data);
    const now = new Date().toISOString();
    this.網址 = data.網址 ?? '';
    this.名稱 = new MultilingualString(data.名稱 ?? {});
    this.描述 = new MultilingualString(data.描述 ?? {});
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

    this.作者 = data.作者 ?? '';
  }

  /** 序列化為持久化用 JSON */
  override toJSON(): Record<string, unknown> {
    const r = super.toJSON();
    r.網址 = this.網址;
    r.名稱 = this.名稱;
    r.描述 = this.描述;
    r.商標 = this.商標;
    r.模式 = this.模式;
    r.佈景主題 = this.佈景主題;
    r.配色 = this.配色;
    r.骨架 = this.骨架;
    r.設定 = this.設定;
    r.主選單 = this.主選單;
    r.語言 = this.語言;
    r.預設語言 = this.預設語言;
    r.資料庫 = this.資料庫;
    r.開始日期 = this.開始日期;
    r.結束日期 = this.結束日期;
    r.作者 = this.作者;
    return r;
  }
}