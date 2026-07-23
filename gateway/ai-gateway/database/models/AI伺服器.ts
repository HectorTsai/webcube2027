/**
 * AI伺服器 — 純資料類別（不再依賴 @dui/database BaseModel）
 *
 * 透過 dataGwClient 與 data-gateway 互動，
 * 此類別僅負責資料結構與序列化。
 */

import { MultilingualString } from '@dui/smartmultilingual';
import type { AI能力 } from '../../services/aiService/provider/adapter.ts';

export interface AI模型定義 {
  名稱: MultilingualString;
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
  當前併發數: number;
  連續成功次數: number;
  連續失敗次數: number;
  解禁時間戳: number;
}

export default class AI伺服器 {
  // ── 資料庫欄位（來自 data-gateway） ──
  public id!: string;
  public createdAt!: string;
  public updatedAt!: string;

  public 名稱: MultilingualString;
  public provider: string;
  public url: string;
  public apiKey: string;
  public 模型列表: AI模型定義[];
  public 併發數上限: number;
  public 動態全域併發上限: number;
  public 冷卻秒數: number;

  // ── 記憶體執行期狀態（不持久化） ──
  public 當前總併發: number = 0;
  public 連續失敗次數: number = 0;
  public 解禁時間戳: number = 0;

  // ── 用量限制 ──
  public 月次數上限: number;
  public 週次數上限: number;
  public 日次數上限: number;
  public 月Token上限: number;
  public 週Token上限: number;
  public 每日Token上限: number;

  // ── 硬體與管理 ──
  public 硬體描述: string;
  public 硬體分數: number;
  public 收費: boolean;
  public 有效日期: string | null;
  public 網站ID: string | null;
  public 啟用: boolean;

  constructor(data: Record<string, unknown> = {}) {
    this.id = (data?.id as string) ?? '';
    this.createdAt = (data?.createdAt as string) ?? new Date().toISOString();
    this.updatedAt = (data?.updatedAt as string) ?? this.createdAt;

    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
    this.provider = (data?.provider as string) ?? 'openai';
    this.url = (data?.url as string) ?? '';
    this.apiKey = (data?.apiKey as string) ?? '';

    const rawModels = (data?.模型列表 as Record<string, unknown>[]) ?? [];
    this.模型列表 = rawModels.map((m) => ({
      名稱: new MultilingualString(m.名稱 as Record<string, string> | undefined),
      能力值: (m.能力值 as number) ?? 0,
      擅長能力: ((m.擅長能力 as AI能力[]) ?? []),
      每分次數上限: (m.每分次數上限 as number) ?? 100,
      每分Token上限: (m.每分Token上限 as number) ?? 40_000,
      併發數上限: (m.併發數上限 as number) ?? 3,
      冷卻秒數: (m.冷卻秒數 as number) ?? 60,
      動態每分次數上限: (m.動態每分次數上限 as number) ?? (m.每分次數上限 as number) ?? 100,
      動態每分Token上限: (m.動態每分Token上限 as number) ?? (m.每分Token上限 as number) ?? 40_000,
      動態併發數上限: (m.動態併發數上限 as number) ?? (m.併發數上限 as number) ?? 3,
      是否為推理模型: (m.是否為推理模型 as boolean) ?? false,
      預期思考超時秒數: (m.預期思考超時秒數 as number) ?? 30,
      當前併發數: 0,
      連續成功次數: 0,
      連續失敗次數: 0,
      解禁時間戳: 0,
    }));

    this.併發數上限 = (data?.併發數上限 as number) ?? 5;
    this.動態全域併發上限 = (data?.動態全域併發上限 as number) ?? this.併發數上限;
    this.冷卻秒數 = (data?.冷卻秒數 as number) ?? 300;

    this.月次數上限 = (data?.月次數上限 as number) ?? 0;
    this.週次數上限 = (data?.週次數上限 as number) ?? 0;
    this.日次數上限 = (data?.日次數上限 as number) ?? 0;
    this.月Token上限 = (data?.月Token上限 as number) ?? 0;
    this.週Token上限 = (data?.週Token上限 as number) ?? 0;
    this.每日Token上限 = (data?.每日Token上限 as number) ?? 0;

    this.硬體描述 = (data?.硬體描述 as string) ?? '';
    this.硬體分數 = (data?.硬體分數 as number) ?? 0;
    this.收費 = (data?.收費 as boolean) ?? false;
    this.有效日期 = (data?.有效日期 as string) ?? null;
    this.網站ID = (data?.網站ID as string) ?? null;
    this.啟用 = (data?.啟用 as boolean) ?? true;
  }

  /** 序列化為持久化用 JSON（排除執行期狀態） */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      名稱: this.名稱.toJSON(),
      provider: this.provider,
      url: this.url,
      apiKey: this.apiKey,
      模型列表: this.模型列表.map(
        ({ 當前併發數, 連續成功次數, 連續失敗次數, 解禁時間戳, ...rest }) => ({
          ...rest,
          名稱: rest.名稱.toJSON(),
        }),
      ),
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