// /models/圖示集.ts — 第六金剛：佈景主題圖示集（語義鍵位版）
//
// 與既有 圖示.ts（存 SVG 實體）不同，本模組用「語義鍵位」映射圖示 ID。
//
// 設計理念：
//   圖示庫（圖示.ts）= 素材池，存 SVG 實體
//   圖示集（本檔案）= 主題播放清單，用標準鍵位 → 圖示 ID 的對照表
//
// 為什麼要硬編碼鍵位？
//   前端元件依賴固定的語義鍵名（如「關閉」「確認」）來查詢圖示。
//   如果每個圖示集可以自由定義鍵名，元件就無法通用。
//   14 個標準鍵位保證所有圖示集對前端來說都是可互換的。

import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

// ── 標準圖示鍵位清單（前端元件依賴的語義名稱） ──
// 擴充方式：在此陣列中新增鍵名，所有既有的圖示集 seed 也需要補上對應欄位。
export const 標準圖示鍵位 = [
  '首頁',
  '選單',
  '新增',
  '關閉',
  '確認',
  '取消',
  '搜尋',
  '使用者',
  '設定',
  '主題',
  '配色',
  '骨架',
  '風格',
  '裝飾',
  '圖示',
  '圖示集',
  '設定',
  '關於',
] as const;

export type 圖示鍵位 = typeof 標準圖示鍵位[number];

export type 圖示映射表 = Record<圖示鍵位, string>;

const DEFAULTS: {
  名稱: Record<string, string>;
  描述: Record<string, string>;
  圖示映射: 圖示映射表;
} = {
  名稱: { en: "Classic Outline", "zh-tw": "經典外框", vi: "Đường viền cổ điển" },
  描述: {
    en: "Classic outline icon set",
    "zh-tw": "經典外框線條圖示集",
    vi: "Bộ biểu tượng đường viền cổ điển",
  },
  // 預設空映射 — 種子資料會覆蓋
  圖示映射: Object.fromEntries(標準圖示鍵位.map(k => [k, ''])) as 圖示映射表,
};

export default class 圖示集 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  /** 語義鍵位 → 圖示 ID 的對照表（14 個鍵位必須全填滿） */
  public 圖示映射: 圖示映射表;

  public constructor(data: Record<string, unknown> = {}, 可刪除: boolean = true) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(
      (data?.名稱 as Record<string, string> | undefined) ?? DEFAULTS.名稱,
    );
    this.描述 = new MultilingualString(
      (data?.描述 as Record<string, string> | undefined) ?? DEFAULTS.描述,
    );
    this.圖示映射 = (data?.圖示映射 as 圖示映射表) ?? { ...DEFAULTS.圖示映射 };
  }

  /** 檢查是否所有標準鍵位都已填滿 */
  public 是否完整(): boolean {
    return 標準圖示鍵位.every(k => !!this.圖示映射[k]);
  }

  /** 取得缺失的鍵位清單 */
  public 缺失鍵位(): string[] {
    return 標準圖示鍵位.filter(k => !this.圖示映射[k]);
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      圖示映射: this.圖示映射,
    };
  }
}
