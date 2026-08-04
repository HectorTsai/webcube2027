import { BaseModel, BaseModelInterface } from "@dui/database/base-model";
import { MultilingualString } from "@dui/smartmultilingual";
import type { PermissionMap } from "@dui/framework";

export interface 角色介面 extends BaseModelInterface {
  名稱: MultilingualString;
  圖示: string;
  /** 權限表（l2/l3），型別由 @dui/framework 的 permission 模組提供 */
  權限: PermissionMap;
}

export class 角色 extends BaseModel implements 角色介面 {
    名稱: MultilingualString;
    圖示: string;
    權限: PermissionMap;

    constructor(data: Partial<角色介面> = {}) {
        super(data);
        this.名稱 = new MultilingualString(data.名稱 ?? {});
        this.圖示 = data.圖示 ?? "圖示:圖示:角色";
        this.權限 = data.權限 ?? {};
    }

    override toJSON(): Record<string, unknown> {
        const r = super.toJSON();
        r.名稱 = this.名稱;
        r.圖示 = this.圖示;
        r.權限 = this.權限;
        return r;
    }
}
