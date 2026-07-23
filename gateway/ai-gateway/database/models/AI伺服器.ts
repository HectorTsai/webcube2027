/**
 * AI伺服器 — schema 介面 + class 實作
 *
 * ── AI伺服器記錄（介面）──
 * 定義完整的資料結構，所有 AI 伺服器相關操作統一使用此介面。
 * 從 data-gateway 取得的 JSON 可直接當作 AI伺服器記錄 使用，
 * 不需要 always new class。
 *
 * ── AI伺服器（class）──
 * 實作 AI伺服器記錄，提供預設值與序列化。
 * 用在「新增伺服器」表單等需要建構新記錄的場合。
 */

import { MultilingualString } from '@dui/smartmultilingual';
import type { AI能力 } from '../../services/aiService/provider/adapter.ts';

// ── 子型別 ──

export interface AI模型定義 {
  名稱: MultilingualString | Record<string, string>;
  能力值: number;
  擅長能力: AI能力[];
  每分次數上限: number;
  每分Token上限: number;
  併發數上限: number;
  冷卻秒數: number;
  動態每分次數上限: number;
  動態每分Token上限: number;
  動態併發數上限: number;
  是否為推理模型: boolean;
  預期思考超時秒數: number;
}

// ── 主介面 ──

export interface AI伺服器記錄 {
  // 系統欄位
  id: string;
  createdAt: string;
  updatedAt: string;

  // 連線設定
  名稱: MultilingualString | Record<string, string>;
  provider: string;
  url: string;
  apiKey: string;
  模型列表: AI模型定義[];

  // 併發與冷卻
  併發數上限: number;
  動態全域併發上限: number;
  冷卻秒數: number;

  // 用量限制
  月次數上限: number;
  週次數上限: number;
  日次數上限: number;
  月Token上限: number;
  週Token上限: number;
  每日Token上限: number;

  // 硬體與管理
  硬體描述: string;
  硬體分數: number;
  收費: boolean;
  有效日期: string | null;
  網站ID: string | null;
  啟用: boolean;
}

// ── Class 實作 ──

export default class AI伺服器 implements AI伺服器記錄 {
  // 系統欄位
  public id!: string;
  public createdAt!: string;
  public updatedAt!: string;

  // 連線設定
  public 名稱: MultilingualString;
  public provider: string;
  public url: string;
  public apiKey: string;
  public 模型列表: AI模型定義[];

  // 併發與冷卻
  public 併發數上限: number;
  public 動態全域併發上限: number;
  public 冷卻秒數: number;

  // 用量限制
  public 月次數上限: number;
  public 週次數上限: number;
  public 日次數上限: number;
  public 月Token上限: number;
  public 週Token上限: number;
  public 每日Token上限: number;

  // 硬體與管理
  public 硬體描述: string;
  public 硬體分數: number;
  public 收費: boolean;
  public 有效日期: string | null;
  public 網站ID: string | null;
  public 啟用: boolean;

  constructor(data: Partial<AI伺服器記錄> = {}) {
    this.id = data.id ?? '';
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? this.createdAt;

    this.名稱 = data.名稱 instanceof MultilingualString
      ? data.名稱
      : new MultilingualString(data.名稱 as Record<string, string> | undefined);
    this.provider = data.provider ?? 'openai';
    this.url = data.url ?? '';
    this.apiKey = data.apiKey ?? '';

    const rawModels = data.模型列表 ?? [];
    this.模型列表 = rawModels.map((m) => ({
      名稱: m.名稱 instanceof MultilingualString
        ? m.名稱
        : new MultilingualString(m.名稱 as Record<string, string> | undefined),
      能力值: m.能力值 ?? 0,
      擅長能力: m.擅長能力 ?? [],
      每分次數上限: m.每分次數上限 ?? 100,
      每分Token上限: m.每分Token上限 ?? 40_000,
      併發數上限: m.併發數上限 ?? 3,
      冷卻秒數: m.冷卻秒數 ?? 60,
      動態每分次數上限: m.動態每分次數上限 ?? m.每分次數上限 ?? 100,
      動態每分Token上限: m.動態每分Token上限 ?? m.每分Token上限 ?? 40_000,
      動態併發數上限: m.動態併發數上限 ?? m.併發數上限 ?? 3,
      是否為推理模型: m.是否為推理模型 ?? false,
      預期思考超時秒數: m.預期思考超時秒數 ?? 30,
    }));

    this.併發數上限 = data.併發數上限 ?? 5;
    this.動態全域併發上限 = data.動態全域併發上限 ?? this.併發數上限;
    this.冷卻秒數 = data.冷卻秒數 ?? 300;

    this.月次數上限 = data.月次數上限 ?? 0;
    this.週次數上限 = data.週次數上限 ?? 0;
    this.日次數上限 = data.日次數上限 ?? 0;
    this.月Token上限 = data.月Token上限 ?? 0;
    this.週Token上限 = data.週Token上限 ?? 0;
    this.每日Token上限 = data.每日Token上限 ?? 0;

    this.硬體描述 = data.硬體描述 ?? '';
    this.硬體分數 = data.硬體分數 ?? 0;
    this.收費 = data.收費 ?? false;
    this.有效日期 = data.有效日期 ?? null;
    this.網站ID = data.網站ID ?? null;
    this.啟用 = data.啟用 ?? true;
  }

  /** 序列化為持久化用 JSON（排除記憶體執行期狀態） */
  toJSON(): AI伺服器記錄 {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      名稱: this.名稱.toJSON(),
      provider: this.provider,
      url: this.url,
      apiKey: this.apiKey,
      模型列表: this.模型列表.map((m) => ({
        名稱: m.名稱 instanceof MultilingualString ? m.名稱.toJSON() : m.名稱,
        能力值: m.能力值,
        擅長能力: m.擅長能力,
        每分次數上限: m.每分次數上限,
        每分Token上限: m.每分Token上限,
        併發數上限: m.併發數上限,
        冷卻秒數: m.冷卻秒數,
        動態每分次數上限: m.動態每分次數上限,
        動態每分Token上限: m.動態每分Token上限,
        動態併發數上限: m.動態併發數上限,
        是否為推理模型: m.是否為推理模型,
        預期思考超時秒數: m.預期思考超時秒數,
      })),
      併發數上限: this.併發數上限,
      動態全域併發上限: this.動態全域併發上限,
      冷卻秒數: this.冷卻秒數,
      月次數上限: this.月次數上限,
      週次數上限: this.週次數上限,
      日次數上限: this.日次數上限,
      月Token上限: this.月Token上限,
      週Token上限: this.週Token上限,
      每日Token上限: this.每日Token上限,
      硬體描述: this.硬體描述,
      硬體分數: this.硬體分數,
      收費: this.收費,
      有效日期: this.有效日期,
      網站ID: this.網站ID,
      啟用: this.啟用,
    };
  }
}