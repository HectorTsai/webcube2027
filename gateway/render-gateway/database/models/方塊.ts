// /models/方塊.ts (2026 統一 schema — 資料驅動方塊定義)
// 打破內建/組合/AI 三模式，改用統一的 JSON 描述：
//   - from: "div" | "input" | "方塊:方塊:Container"
//   - args: 可接受參數定義
//   - alpine: Alpine.js 狀態設定
//   - on: 事件綁定 (x-on)
//   - style/className: 預設樣式
//   - slots: 具名插槽 (head, body, foot...)
//   - children: 匿名子方塊或文字 (陣列，元素可為物件或字串)
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
    /** 傳給內部 fallback（如 Container）的 className，不跟 wrapper 合併 */
    containerClassName?: string;
    /** 傳給 definition.wrap 元素（如 <ul>）的 className */
    wrapClassName?: string;
    style?: Record<string, string>;
    alpine?: Record<string, unknown>;
    on?: Record<string, string>;
    data?: Record<string, string>;
  }>;
}

/** 包裹層定義 — children 先用此 from 包起來再傳給 from 元件 */
export interface WrapDef {
  from: string;
  className?: string;
  style?: Record<string, string>;
  /** 條件式 className：key = arg 名，arg 為 truthy 時注入對應 UnoCSS 類名字串 */
  styleConditions?: Record<string, string>;
  /** void 元素（如 input）不接 children，直接 self-close */
  void?: boolean;
}

/** prepend/append 項目定義 — 放在 from 元件內部、children 前後的條件式元素 */
export interface AffixDef {
  from: string;
  className?: string;
  style?: Record<string, string>;
  /** arg 名 — 該 arg 為 truthy 時才渲染；不設則始終渲染 */
  if?: string;
  /** 替代字串（"{argName}" 替換為 arg 值）或用 from 指向子方塊 */
  children?: (string | Record<string, unknown>)[];
}

// ---------- 預設值 ----------
const DEFAULT_VALUES = {
  名稱: { en: "Cube", "zh-tw": "方塊", vi: "Khối" },
  描述: { en: "Universal data-driven component definition", "zh-tw": "萬用資料驅動元件定義", vi: "Định nghĩa thành phần phổ quát" },
  from: "",
  args: {} as Record<string, ArgDef>,
  style: {} as Record<string, string>,
  className: "",
  售價: 0,
  version: 1,
};

// ---------- Model 類別 ----------
// 方塊 的 from, args 等渲染欄位直接宣告在 class 上
// 其他模組使用 Partial<方塊> 即可取得渲染所需的型別
export default class 方塊 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public from: string;
  /** 當 from 非原生標籤時，包裝用的 HTML 標籤（例如 "button" 讓 Container 有按鈕行為） */
  public tag: string | undefined;
  /** 包裝標籤的靜態 HTML 屬性（例如 type="button"） */
  public attrs: Record<string, string> | undefined;
  public args: Record<string, ArgDef>;
  public alpine: Record<string, unknown> | undefined;
  public on: Record<string, string> | undefined;
  public data: Record<string, string> | undefined;
  public style: Record<string, string>;
  public className: string;
  public slots: Record<string, unknown> | undefined;
  public children: (Record<string, unknown> | string)[] | undefined;
  /** children 包裹層 */
  public wrap: WrapDef | undefined;
  /** 每個 child 的包裹層（如 <li> 包裹列表項） */
  public wrapChild: WrapDef | undefined;
  /** from 元件內部、children 之前的條件式元素 */
  public prepend: AffixDef[] | undefined;
  /** from 元件內部、children 之後的條件式元素 */
  public append: AffixDef[] | undefined;
  /** key = arg 名，arg 為 truthy 時注入對應 CSS */
  public styleConditions: Record<string, string> | undefined;
  public 售價: number;
  /** 動態參數定義：key = 變數名，value = @api/... 規格字串 */
  public mergedArgs: Record<string, string> | undefined;
  /** 內部鎖定參數，最後套用至 mergedArgs，不受外部 runtimeArgs 覆蓋 */
  public defaults: Record<string, unknown> | undefined;
  /** 宣告式全域 Alpine Store 依賴（如 ["drawers", "layout"]），管線自動收集並在 alpine:init 註冊 */
  public declareStores: string[] | undefined;
  /** SHA-256 完整性雜湊，AI 審查通過後寫入，渲染前驗證 */
  public 已檢驗: string;
  /** 方塊規格版本號，用於判斷是否需要升級 */
  public version: number;
  /** 上次接受 AI 審查升級的時間 */
  public last_reviewed_at: Date | null;

  public constructor(data: Record<string, unknown> = {}, 可刪除?: boolean) {
    super(data, 可刪除 ?? (data?.可刪除 as boolean | undefined) ?? true);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? DEFAULT_VALUES.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? DEFAULT_VALUES.描述);
    this.from = (data?.from as string) ?? DEFAULT_VALUES.from;
    this.tag = (data?.tag as string | undefined) ?? undefined;
    this.attrs = (data?.attrs as Record<string, string> | undefined) ?? undefined;
    this.args = (data?.args as Record<string, ArgDef>) ?? { ...DEFAULT_VALUES.args };
    this.alpine = (data?.alpine as Record<string, unknown> | undefined) ?? undefined;
    this.on = (data?.on as Record<string, string> | undefined) ?? undefined;
    this.data = (data?.data as Record<string, string> | undefined) ?? undefined;
    this.style = (data?.style as Record<string, string>) ?? { ...DEFAULT_VALUES.style };
    this.className = (data?.className as string) ?? DEFAULT_VALUES.className;
    this.slots = (data?.slots as Record<string, unknown> | undefined) ?? undefined;
    this.children = (data?.children as (Record<string, unknown> | string)[] | null | undefined) ?? undefined;
    this.wrap = (data?.wrap as WrapDef | undefined) ?? undefined;
    this.wrapChild = (data?.wrapChild as WrapDef | undefined) ?? undefined;
    this.prepend = (data?.prepend as AffixDef[] | undefined) ?? undefined;
    this.append = (data?.append as AffixDef[] | undefined) ?? undefined;
    this.styleConditions = (data?.styleConditions as Record<string, string> | undefined) ?? undefined;
    this.mergedArgs = (data?.mergedArgs as Record<string, string> | undefined) ?? undefined;
    this.defaults = (data?.defaults as Record<string, unknown> | undefined) ?? undefined;
    this.declareStores = (data?.declareStores as string[] | undefined) ?? undefined;
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
    this.已檢驗 = (data?.已檢驗 as string) ?? '';
    this.version = (data?.version as number) ?? DEFAULT_VALUES.version;
    const lastReviewed = data?.last_reviewed_at as string | number | Date | undefined;
    this.last_reviewed_at = lastReviewed ? new Date(lastReviewed) : null;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      from: this.from,
      tag: this.tag,
      attrs: this.attrs,
      args: this.args,
      alpine: this.alpine,
      on: this.on,
      data: this.data,
      style: this.style,
      className: this.className,
      slots: this.slots,
      children: this.children,
      wrap: this.wrap,
      wrapChild: this.wrapChild,
      prepend: this.prepend,
      append: this.append,
      styleConditions: this.styleConditions,
      mergedArgs: this.mergedArgs,
      defaults: this.defaults,
      declareStores: this.declareStores,
      售價: this.售價,
      已檢驗: this.已檢驗,
      version: this.version,
      last_reviewed_at: this.last_reviewed_at,
    };
  }
}
