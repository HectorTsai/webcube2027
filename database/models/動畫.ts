// /models/動畫.ts
import { 資料 } from "../index.ts";
import { MultilingualString } from "@dui/smartmultilingual";

const DEFAULT_VALUES = {
  名稱: { en: "fade", "zh-tw": "經典淡入淡出", vi: "mờ dần" },
  描述: { en: "Classic fade in and out animation", "zh-tw": "標準通用淡入淡出交互特效", vi: "Hiệu ứng mờ dần" },
  
  // 🌟【萬能動畫管道核心】
  // 未來不管是新增「折疊面板」還是「吐司訊息」，AI 只要在這裡直接加 Key 即可。
  // 前端元件直接讀取：`動畫模型.配置["下拉選單:開"]`。
  // 程式碼與資料庫欄位這輩子不用再改動任何一行！
  配置: {
    "下拉選單:開": "animate_in animate__fadeIn",
    "下拉選單:關": "animate_in animate__fadeOut",
    
    "抽屜:上:開": "animate_in animate__fadeIn",
    "抽屜:上:關": "animate_in animate__fadeOut",
    "抽屜:下:開": "animate_in animate__fadeIn",
    "抽屜:下:關": "animate_in animate__fadeOut",
    "抽屜:左:開": "animate_in animate__fadeIn",
    "抽屜:左:關": "animate_in animate__fadeOut",
    "抽屜:右:開": "animate_in animate__fadeIn",
    "抽屜:右:關": "animate_in animate__fadeOut",
    
    "視窗:開": "animate_in animate__fadeIn",
    "視窗:關": "animate_in animate__fadeOut",
    
    "彈出:開": "animate_in animate__fadeIn",
    "彈出:關": "animate_in animate__fadeOut",

    // 🔥 未來元件擴充（範例）：直接加，完全不影響任何既有架構！
    "折疊面板:開": "animate_in animate__slideInDown",
    "折疊面板:關": "animate_in animate__slideOutUp",
    "吐司訊息:進場": "animate_in animate__backInRight",
    "吐司訊息:出場": "animate_in animate__fadeOutRight"
  },
  售價: 0
};

export default class 動畫 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualString;
  public 配置: Record<string, string>; // 萬能動畫 Class 映射水庫
  public 售價: number;

  public constructor(data: Record<string, unknown> = {}, 可刪除: boolean = true) {
    super(data, 可刪除);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined ?? DEFAULT_VALUES.名稱);
    this.描述 = new MultilingualString(data?.描述 as Record<string, string> | undefined ?? DEFAULT_VALUES.描述);
    this.配置 = (data?.配置 as Record<string, string>) ?? { ...DEFAULT_VALUES.配置 };
    this.售價 = (data?.售價 as number) ?? DEFAULT_VALUES.售價;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱.toJSON(),
      描述: this.描述.toJSON(),
      配置: this.配置,
      售價: this.售價,
    };
  }
}