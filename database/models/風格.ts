import { 權限, 資料 } from "../index.ts";
import { MultilingualString, SmartContent, MultilingualSmartContent } from "@dui/smartmultilingual";

export default class 風格 extends 資料 {
  public 名稱: MultilingualString;
  public 描述: MultilingualSmartContent;
  public 版本: string;
  public 售價: number = 0;

  // 預設風格定義 - 系統資料庫未連線時使用
  public static readonly 預設風格: Record<string, any> = {
    '實心': {
      id: '實心',
      名稱: { 'zh-tw': '實心風格', 'en': 'Solid Style' },
      描述: { 
        'zh-tw': { format: 'text', content: '實心填充的按鈕風格，適合主要操作。具有強烈的視覺吸引力，適合需要使用者注意的重要操作按鈕。' },
        'en': { format: 'text', content: 'Solid filled button style, suitable for primary actions. Has strong visual appeal, suitable for important action buttons that require user attention.' }
      },
      版本: '1.0.0',
      來源: '預設'
    },
    '幽靈': {
      id: '幽靈',
      名稱: { 'zh-tw': '幽靈風格', 'en': 'Ghost Style' },
      描述: { 
        'zh-tw': { format: 'text', content: '透明背景的按鈕風格，適合次要操作。保持簡潔的視覺效果，不干擾主要內容的呈現。' },
        'en': { format: 'text', content: 'Transparent background button style, suitable for secondary actions. Maintains clean visual effects without interfering with main content presentation.' }
      },
      版本: '1.0.0',
      來源: '預設'
    },
    '線框': {
      id: '線框',
      名稱: { 'zh-tw': '線框風格', 'en': 'Outline Style' },
      描述: { 
        'zh-tw': { format: 'text', content: '線框邊界的按鈕風格，適合輔助操作。提供清晰的邊界指示，但保持輕量的視覺效果。' },
        'en': { format: 'text', content: 'Outline border button style, suitable for auxiliary actions. Provides clear boundary indication while maintaining lightweight visual effects.' }
      },
      版本: '1.0.0',
      來源: '預設'
    }
  }

  // 取得預設風格列表 (陣列格式)
  public static get 預設風格列表(): any[] {
    return Object.values(風格.預設風格)
  }

  // 取得預設風格 ID 列表
  public static get 預設風格ID列表(): string[] {
    return Object.keys(風格.預設風格)
  }

  public constructor(data: Record<string, unknown> = {},權限設定: 權限 = { 讀: true, 寫: true, 刪除: true }) {
    super(data, 權限設定);
    this.名稱 = new MultilingualString(data?.名稱 as Record<string, string> | undefined);
    this.描述 = new MultilingualSmartContent(data?.描述 as Record<string, SmartContent | { format: string; content: string | Uint8Array; }> | undefined);
    this.版本 = (data?.版本 as string) ?? "1.0.0";
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      名稱: this.名稱,
      描述: this.描述,
      版本: this.版本,
      售價: this.售價,
    };
  }
}
