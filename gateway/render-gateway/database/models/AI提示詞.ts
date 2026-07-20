// /models/AI提示詞.ts — AI 提示詞模板，存於資料庫可線上修改
import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULT_VALUES = {
  名稱: { en: "System Prompt", "zh-tw": "系統提示詞" },
  描述: { en: "AI system prompt template", "zh-tw": "AI 系統提示詞模板" },
  系統提示: "",
  版本: 1,
};

export default class AI提示詞 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 系統提示: string;
  public 版本: number;
  public 啟用: boolean;
  public 可修改: boolean;

  public constructor(data: Record<string, unknown> = {}, 可刪除: boolean = true) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(
      data?.名稱 as Record<string, string> | undefined ?? DEFAULT_VALUES.名稱,
    );
    this.描述 = new MultilingualString(
      data?.描述 as Record<string, string> | undefined ?? DEFAULT_VALUES.描述,
    );
    this.系統提示 = (data?.系統提示 as string) ?? DEFAULT_VALUES.系統提示;
    this.版本 = (data?.版本 as number) ?? DEFAULT_VALUES.版本;
    this.啟用 = (data?.啟用 as boolean) ?? true;
    this.可修改 = (data?.可修改 as boolean) ?? true;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      系統提示: this.系統提示,
      版本: this.版本,
      啟用: this.啟用,
      可修改: this.可修改,
    };
  }
}