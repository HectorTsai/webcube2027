/**
 * 使用者資料模型 — 雙層繼承架構
 *
 * - 公開使用者（PublicUser）：僅含公開欄位（名稱、圖示、角色），供非特權使用者檢視
 * - 使用者（User）：繼承公開使用者，加入敏感欄位（帳號、密碼雜湊、其他資訊、最後登入）
 *
 * 使用方式：
 *   非特權請求（無法完整讀取該使用者）→ 用 公開使用者.toJSON() 自動過濾
 *   特權請求 → 用 使用者.toJSON() 回傳完整資料
 *
 * 權限判定委託 @dui/framework 的 checkAccess()，依角色權限表（PermissionMap）決定，
 * 而非硬編碼角色名稱。
 */
import { BaseModel, BaseModelInterface } from "@dui/database";
import { MultilingualString } from "@dui/smartmultilingual";
import { checkAccess } from '@dui/framework';

// ─── 公開使用者（PublicUser）────────────────────────────

export interface 公開使用者介面 extends BaseModelInterface {
  /** Composite ID，格式為 使用者:使用者:{username} */
  id: string;
  名稱: MultilingualString;
  圖示: string;
  角色: string[];
}

export class 公開使用者 extends BaseModel implements 公開使用者介面 {
    名稱: MultilingualString;
    圖示: string;
    角色: string[];

    constructor(data: Partial<公開使用者介面> = {}) {
        super(data);
        this.名稱 = new MultilingualString(data.名稱 ?? {});
        this.圖示 = data.圖示 ?? "圖示:圖示:使用者";
        this.角色 = data.角色 ?? [];
    }

    override toJSON(): Record<string, unknown> {
        const r = super.toJSON();
        r.名稱 = this.名稱;
        r.圖示 = this.圖示;
        r.角色 = this.角色;
        return r;
    }
}

// ─── 完整使用者（User）───────────────────────────────────

export interface 使用者介面 extends 公開使用者介面 {
  帳號: string;
  密碼雜湊: string;
  其他資訊: Record<string, string>;
  最後登入: string;
}

export class 使用者 extends 公開使用者 implements 使用者介面 {
    帳號: string;
    密碼雜湊: string;
    其他資訊: Record<string, string>;
    最後登入: string;

    constructor(data: Partial<使用者介面> = {}) {
        super(data);
        this.帳號 = data.帳號 ?? "";
        this.密碼雜湊 = data.密碼雜湊 ?? "";
        this.其他資訊 = data.其他資訊 ?? {};
        this.最後登入 = data.最後登入 ?? new Date().toISOString();
    }

    override toJSON(): Record<string, unknown> {
        const r = super.toJSON();
        r.帳號 = this.帳號;
        r.密碼雜湊 = this.密碼雜湊;
        r.其他資訊 = this.其他資訊;
        r.最後登入 = this.最後登入;
        return r;
    }
}

// ─── 權限輔助函式 ────────────────────────────────────────

/**
 * 判斷請求者是否可以檢視指定使用者的完整資料（含帳號、最後登入等）。
 *
 * 判定方式（依序）：
 *   1. 利用 @dui/framework 的 checkAccess() 檢查 JWT payload 中的權限地圖
 *      — 對 l2/使用者 有「讀」權限（含 true 或 self）→ 可檢視完整資料
 *   2. 請求者為目標使用者本人（sub === targetUserId）→ 可檢視完整資料
 *
 * @param payload          JWT payload（含 `權限`、`sub` 欄位）
 * @param targetUserId     目標使用者的完整 ID（如 `使用者:使用者:member`）
 * @returns true 表示可檢視完整資料
 */
export function canViewFullUserData(
  payload: Record<string, unknown> | undefined,
  targetUserId: string,
): boolean {
  if (!payload) return false;
  if (checkAccess(payload, 'l2', '使用者', '讀', targetUserId)) return true;
  if (payload.sub === targetUserId) return true;
  return false;
}