import { BaseModel, BaseModelInterface } from "@dui/database/base-model";
import { MultilingualString } from "@dui/smartmultilingual";
export interface 使用者介面 extends BaseModelInterface {
  /** Composite ID，格式為 使用者:使用者:{username}，如 使用者:使用者:訪客 */
  id: string;
  名稱: MultilingualString;
  帳號: string;
  圖示: string;
  角色: string[];
  密碼雜湊: string;
  其他資訊: Record<string, string>;
  最後登入: string;
}

export class 使用者 extends BaseModel implements 使用者介面 {
    名稱: MultilingualString;
    帳號: string;
    圖示: string;
    角色: string[];
    密碼雜湊: string;
    其他資訊: Record<string, string>;
    最後登入: string;

    constructor(data: Partial<使用者介面> = {}) {
        super(data);
        const now = new Date().toISOString();
        this.名稱 = new MultilingualString(data.名稱 ?? {});
        this.帳號 = data.帳號 ?? "";
        this.圖示 = data.圖示 ?? "圖示:圖示:使用者";
        this.角色 = data.角色 ?? [];
        this.密碼雜湊 = data.密碼雜湊 ?? "";
        this.其他資訊 = data.其他資訊 ?? {};
        this.最後登入 = data.最後登入 ?? now;
    }

    override toJSON(): Record<string, unknown> {
        const r = super.toJSON();
        r.名稱 = this.名稱;
        r.帳號 = this.帳號;
        r.圖示 = this.圖示;
        r.角色 = this.角色;
        r.密碼雜湊 = this.密碼雜湊;
        r.其他資訊 = this.其他資訊;
        r.最後登入 = this.最後登入;
        return r;
    }
}