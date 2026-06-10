// AI伺服器 Model — 可存於 L2 系統資料庫（系統級）或 L3 租戶資料庫（網站自備）
// 系統管理員可隨時新增/移除，每個 server 獨立一筆

import { 資料 } from "../index.ts";
import SecretString from "../secretstring.ts";

/** 單一模型定義 */
export interface AI模型定義 {
  名稱: string;              // "gpt-4o" | "qwen2.5:7b" | "Xenova/Qwen2.5-1.5B-Instruct"
  能力值: number;            // 1-10（該模型在此硬體上的推論能力）
  擅長能力: string[];        // ["文本生成","翻譯","代碼生成","CSS與設計",...]
}

export default class AI伺服器 extends 資料 {
  public 名稱: string;
  public provider: string;            // ollama | openai | anthropic | gemini | deepseek | groq | transformer ...
  public url: string;
  public apiKey: SecretString;
  public 模型列表: AI模型定義[];       // 一個 server 可有多個 model
  public 硬體描述: string;            // "Intel i9-13900K, 64GB, RTX 4090 24GB"
  public 硬體分數: number;             // AI 自評後快取（整台機器的基礎分，0=尚未評分）
  public 收費: boolean;
  public 月次數上限: number;           // 0 = 無限
  public 有效日期: string | null;      // ISO date string，null=永久；過期後 Pool 自動排除
  public 網站ID: string | null;        // null=系統級(L2)，有值=網站自備(L3)
  public 啟用: boolean;

  constructor(data: Record<string, unknown> = {}, 可刪除 = true) {
    super(data, 可刪除);
    this.名稱 = (data?.名稱 as string) ?? "";
    this.provider = (data?.provider as string) ?? "ollama";
    this.url = (data?.url as string) ?? "";
    const rawKey = data?.apiKey as string;
    this.apiKey = rawKey?.startsWith('enc:')
      ? new SecretString({ cipherText: rawKey })
      : new SecretString({ plainText: rawKey });
    this.模型列表 = (data?.模型列表 as AI模型定義[]) ?? [];
    this.硬體描述 = (data?.硬體描述 as string) ?? "";
    this.硬體分數 = (data?.硬體分數 as number) ?? 0;
    this.收費 = (data?.收費 as boolean) ?? false;
    this.月次數上限 = (data?.月次數上限 as number) ?? 0;
    this.有效日期 = (data?.有效日期 as string) ?? null;
    this.網站ID = (data?.網站ID as string) ?? null;
    this.啟用 = (data?.啟用 as boolean) ?? true;
  }

  /** 取得最高的模型能力值 */
  get 最高能力值(): number {
    if (this.模型列表.length === 0) return 0;
    return Math.max(...this.模型列表.map(m => m.能力值));
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      provider: this.provider,
      url: this.url,
      apiKey: this.apiKey.CipherText,
      模型列表: this.模型列表,
      硬體描述: this.硬體描述,
      硬體分數: this.硬體分數,
      收費: this.收費,
      月次數上限: this.月次數上限,
      有效日期: this.有效日期,
      網站ID: this.網站ID,
      啟用: this.啟用,
    };
  }
}
