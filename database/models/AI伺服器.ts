// AI伺服器 Model — 可存於 L2 系統資料庫（系統級）或 L3 租戶資料庫（網站自備）
// 系統管理員可隨時新增/移除，每個 server 獨立一筆

import { 資料 } from "../index.ts";
import SecretString from "../secretstring.ts";
import { AI能力 } from "../../services/aiService/provider/adapter.ts";

/** * 模型級定義 (Model-level)
 * 管理員完全不用填！加入伺服器時，系統呼叫 AI 會自動根據平台規格填入「初始限制天花板」，
 * 隨後 Pool 會在「動態變數」上進行上下調諧。
 */
export interface AI模型定義 {
  名稱: string;              // 例如 "gpt-4o", "claude-3-5-sonnet"
  能力值: number;            // 1-10（AI 自動評分帶入）
  擅長能力: AI能力[];        // 強型別防呆

  // ── 🛡️ 限制天花板 (核心天花板，由 AI 初始化填入，運行時不可超越) ──
  每分次數上限: number;        // 官方規定的 RPM 限制，0 = 無限
  每分Token上限: number;       // 官方規定的 TPM 限制，0 = 無限
  併發數上限: number;          // 官方規定的最大並行上限，0 = 無限
  冷卻秒數: number;            // 發生模型錯誤時，建議的冷卻秒數

  // ── 🧠 自適應動態限制變數 (Pool 在此範圍內動態上下調整，不可超過上方天花板) ──
  動態每分次數上限: number;    // 初始等於「每分次數上限」，遇到 429 就打折，成功就慢慢加回
  動態每分Token上限: number;   // 初始等於「每分Token上限」
  動態併發數上限: number;     // 初始等於「併發數上限」，出錯時調低，穩定時逐步往上試探

  // ── 記憶體即時運行計數器 (toJSON 時剔除) ──
  當前併發數: number;          // 目前該模型正在處理中的請求數
  連續成功次數: number;        // 連續成功幾次（用來觸發「動態限制往上加」）
  連續失敗次數: number;        // 連續失敗幾次（用來觸發「單獨模型冷卻」）
  解禁時間戳: number;          // 該模型冷卻截止時間戳，0 = 正常
}

export default class AI伺服器 extends 資料 {
  // 管理員唯一需要手動選擇與輸入的 4 個欄位
  public 名稱: string;
  public provider: string;
  public url: string;
  public apiKey: SecretString;

  // 全自動填入與自適應調度欄位
  public 模型列表: AI模型定義[];       // 由系統呼叫 API + AI 自評後自動填入
  
  // ── 伺服器級【限制天花板與動態變數】 ──
  public 併發數上限: number;          // 整台伺服器/Key的官方最大並行天花板（免費 Key 通常是 1~2），0 = 無限
  public 動態全域併發上限: number;    // 初始等於「併發數上限」，運行時若遇到全域 429 則自動調低
  public 冷卻秒數: number;            // 整台伺服器發生大故障（如 Key 刷爆）時的預設冷卻秒數

  // 伺服器級即時狀態監控 (toJSON 時剔除)
  public 當前總併發: number = 0;        
  public 連續失敗次數: number = 0;      
  public 解禁時間戳: number = 0;        // 整台 Server 的全域冷卻時間戳

  // 長時間商業計費總量安全線（一般預設 0 = 無限，除非系統管理員想要做 L3 的租戶月預算控管）
  public 月次數上限: number;           
  public 週次數上限: number;           
  public 日次數上限: number;           
  public 月Token上限: number;          
  public 週Token上限: number;          
  public 每日Token上限: number;        

  // 基礎系統配置
  public 硬體描述: string;            
  public 硬體分數: number;             
  public 收費: boolean;                
  public 有效日期: string | null;      
  public 網站ID: string | null;        
  public 啟用: boolean;

  constructor(data: Record<string, unknown> = {}, 可刪除 = true) {
    super(data, 可刪除);
    this.名稱 = (data?.名稱 as string) ?? "";
    this.provider = (data?.provider as string) ?? "openai";
    this.url = (data?.url as string) ?? "";
    
    const rawKey = data?.apiKey as string;
    this.apiKey = rawKey?.startsWith('enc:')
      ? new SecretString({ cipherText: rawKey })
      : new SecretString({ plainText: rawKey });
    
    // 解析模型列表
    const rawModels = (data?.模型列表 as Record<string, unknown>[]) ?? [];
    this.模型列表 = rawModels.map(m => {
      const rpm = (m.每分次數上限 as number) ?? 100;
      const tpm = (m.每分Token上限 as number) ?? 40000;
      const concurrency = (m.併發數上限 as number) ?? 3;
      return {
        名稱: (m.名稱 as string) ?? "",
        能力值: (m.能力值 as number) ?? 0,
        擅長能力: ((m.擅長能力 as AI能力[]) ?? []),
        
        // 核心天花板
        每分次數上限: rpm,
        每分Token上限: tpm,
        併發數上限: concurrency,
        冷卻秒數: (m.冷卻秒數 as number) ?? 60,
        
        // 運行時動態調整值 (初始與天花板對齊)
        動態每分次數上限: (m.動態每分次數上限 as number) ?? rpm,
        動態每分Token上限: (m.動態每分Token上限 as number) ?? tpm,
        動態併發數上限: (m.動態併發數上限 as number) ?? concurrency,
        
        // 運行時計數器
        當前併發數: 0,
        連續成功次數: 0,
        連續失敗次數: 0,
        解禁時間戳: 0
      };
    });

    // 伺服器級限制與動態值
    this.併發數上限 = (data?.併發數上限 as number) ?? 5;
    this.動態全域併發上限 = (data?.動態全域併發上限 as number) ?? this.併發數上限;
    this.冷卻秒數 = (data?.冷卻秒數 as number) ?? 300;
    this.解禁時間戳 = 0;

    // 長時間總量安全線
    this.月次數上限 = (data?.月次數上限 as number) ?? 0;
    this.週次數上限 = (data?.週次數上限 as number) ?? 0;
    this.日次數上限 = (data?.日次數上限 as number) ?? 0;
    this.月Token上限 = (data?.月Token上限 as number) ?? 0;
    this.週Token上限 = (data?.週Token上限 as number) ?? 0;
    this.每日Token上限 = (data?.每日Token上限 as number) ?? 0;

    this.硬體描述 = (data?.硬體描述 as string) ?? "";
    this.硬體分數 = (data?.硬體分數 as number) ?? 0;
    this.收費 = (data?.收費 as boolean) ?? false;
    this.有效日期 = (data?.有效日期 as string) ?? null;
    this.網站ID = (data?.網站ID as string) ?? null;
    this.啟用 = (data?.啟用 as boolean) ?? true;
  }

  public override async 初始化(): Promise<void> {
    await this.apiKey.process();
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      provider: this.provider,
      url: this.url,
      apiKey: this.apiKey.CipherText,
      // 🟢 序列化進 DB 時，剔除即時運行的狀態計數器與時間戳，但保留摸索出來的【動態上限】與【限制天花板】
      模型列表: this.模型列表.map(({ 當前併發數, 連續成功次數, 連續失敗次數, 解禁時間戳, ...其餘欄位 }) => 其餘欄位),
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
