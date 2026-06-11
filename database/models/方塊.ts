// /models/方塊.ts (2026 統一 schema — 資料驅動方塊定義)
// 打破內建/組合/AI 三模式，改用統一的 JSON 描述：
//   - from: "div" | "input" | "方塊:方塊:Container"
//   - args: 可接受參數定義
//   - alpine: Alpine.js 狀態設定
//   - on: 事件綁定 (x-on)
//   - style/className: 預設樣式
//   - slots: 具名插槽 (head, body, foot...)
//   - children: 匿名子方塊或文字 (陣列, 元素可為物件或字串)
import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

// ---------- 型別定義 ----------
export interface ArgDef {
  type: "string" | "number" | "boolean";
  description?: string;
  default?: unknown;
  options?: string[];
  /** 每個 option 值對應的 className/style/alpine/on/data 覆寫 */
  variants?: Record<string, {
    className?: string;
    style?: Record<string, string>;
    alpine?: Record<string, unknown>;
    on?: Record<string, string>;
    data?: Record<string, string>;
  }>;
}

// ---------- 預設值 ----------
const DEFAULT_VALUES = {
  名稱: { en: "Cube", "zh-tw": "方塊", vi: "Khối" },
  描述: { en: "Universal data-driven component definition", "zh-tw": "萬用資料驅動元件定義", vi: "Định nghĩa thành phần phổ quát" },
  from: "div",
  args: {} as Record<string, ArgDef>,
  style: {} as Record<string, string>,
  className: "",
  售價: 0,
};

// ---------- Model 類別 ----------
// 方塊 的 from, args 等渲染欄位直接宣告在 class 上
// 其他模組使用 Partial<方塊> 即可取得渲染所需的型別
export default class 方塊 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public from: string;
  public args: Record<string, ArgDef>;
  public alpine: Record<string, unknown> | undefined;
  public on: Record<string, string> | undefined;
  public data: Record<string, string> | undefined;
  public style: Record<string, string>;
  public className: string;
  public slots: Record<string, unknown> | undefined;
  public children: (Record<string, unknown> | string)[] | undefined;
  public 售價: number;
  /** SHA-256 完整性雜湊，AI 審查通過後寫入，渲染前驗證 */
  public 已檢驗: string;

  public constructor(data: Record<string, unknown> = {}, 可刪除: boolean = true) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? DEFAULT_VALUES.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? DEFAULT_VALUES.描述);
    this.from = (data?.from as string) ?? DEFAULT_VALUES.from;
    this.args = (data?.args as Record<string, ArgDef>) ?? { ...DEFAULT_VALUES.args };
    this.alpine = (data?.alpine as Record<string, unknown> | undefined) ?? undefined;
    this.on = (data?.on as Record<string, string> | undefined) ?? undefined;
    this.data = (data?.data as Record<string, string> | undefined) ?? undefined;
    this.style = (data?.style as Record<string, string>) ?? { ...DEFAULT_VALUES.style };
    this.className = (data?.className as string) ?? DEFAULT_VALUES.className;
    this.slots = (data?.slots as Record<string, unknown> | undefined) ?? undefined;
    this.children = (data?.children as (Record<string, unknown> | string)[] | null | undefined) ?? undefined;
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
    this.已檢驗 = (data?.已檢驗 as string) ?? '';
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      from: this.from,
      args: this.args,
      alpine: this.alpine,
      on: this.on,
      data: this.data,
      style: this.style,
      className: this.className,
      slots: this.slots,
      children: this.children,
      售價: this.售價,
      已檢驗: this.已檢驗,
    };
  }
}