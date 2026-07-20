// 系統設定 Model — 取代環境變數，單筆記錄承載全部系統設定
import { BaseModel } from "@dui/database";

export default class 系統設定 extends BaseModel {
  // ── 安全 ──
  /** API Key 加密金鑰（AES-GCM + PBKDF2），留空則系統首次啟動自動生成 */
  加密金鑰 = "";
  // ── 排程 ──
  /** 外部排程器 URL（含 protocol），留空則使用內建 Deno.cron 排程器 */
  外部排程器URL = "";
  // ── 日誌 ──
  /** 日誌等級：debug / info / warn / error */
  日誌等級 = "info";
  // ── 伺服器 ──
  /** HTTP 服務監聽端口 */
  伺服器端口 = 8000;
  // ── L2 資料庫連線 ──
  /** L2 資料庫類型：mysql / postgres / mongodb / sqlite，空字串表示未設定 */
  L2資料庫類型 = "";
  /** L2 資料庫主機 */
  L2主機 = "";
  /** L2 資料庫端口（0 表示未設定） */
  L2端口 = 0;
  /** L2 資料庫名稱 */
  L2資料庫名稱 = "";
  /** L2 資料庫使用者 */
  L2使用者 = "";
  /** L2 資料庫密碼 */
  L2密碼 = "";
  // ── AI Pool 自適應參數 ──
  /** 連續成功 N 次後觸發動態上限回升 */
  池回升連續次數 = 5;
  /** 連續失敗 N 次後觸發 model 冷卻 */
  池冷卻失敗次數 = 8;
  /** 回升倍率（例如 1.50 = 每次 +50%） */
  池回升倍率 = 1.50;
  /** 429 觸發打折率（例如 0.95 = 保留 95%） */
  池限流打折率 = 0.95;
  /** 同一次請求最多嘗試 N 個候選 model */
  池最大重試 = 3;

  constructor(data: Record<string, unknown> = {}, deletable = true) {
    super(data, deletable);
    this.加密金鑰 = (data?.加密金鑰 as string) ?? "";
    this.外部排程器URL = (data?.外部排程器URL as string) ?? "";
    this.日誌等級 = (data?.日誌等級 as string) ?? "info";
    this.伺服器端口 = (data?.伺服器端口 as number) ?? 8000;
    this.L2資料庫類型 = (data?.L2資料庫類型 as string) ?? "";
    this.L2主機 = (data?.L2主機 as string) ?? "";
    this.L2端口 = (data?.L2端口 as number) ?? 0;
    this.L2資料庫名稱 = (data?.L2資料庫名稱 as string) ?? "";
    this.L2使用者 = (data?.L2使用者 as string) ?? "";
    this.L2密碼 = (data?.L2密碼 as string) ?? "";
    this.池回升連續次數 = (data?.池回升連續次數 as number) ?? 5;
    this.池冷卻失敗次數 = (data?.池冷卻失敗次數 as number) ?? 8;
    this.池回升倍率 = (data?.池回升倍率 as number) ?? 1.50;
    this.池限流打折率 = (data?.池限流打折率 as number) ?? 0.95;
    this.池最大重試 = (data?.池最大重試 as number) ?? 3;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      加密金鑰: this.加密金鑰,
      外部排程器URL: this.外部排程器URL,
      日誌等級: this.日誌等級,
      伺服器端口: this.伺服器端口,
      L2資料庫類型: this.L2資料庫類型,
      L2主機: this.L2主機,
      L2端口: this.L2端口,
      L2資料庫名稱: this.L2資料庫名稱,
      L2使用者: this.L2使用者,
      L2密碼: this.L2密碼,
      池回升連續次數: this.池回升連續次數,
      池冷卻失敗次數: this.池冷卻失敗次數,
      池回升倍率: this.池回升倍率,
      池限流打折率: this.池限流打折率,
      池最大重試: this.池最大重試,
    };
  }
}
