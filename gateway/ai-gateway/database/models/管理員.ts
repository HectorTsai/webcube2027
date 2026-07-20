// 管理員 Model
import { BaseModel } from "@dui/database";

export default class 管理員 extends BaseModel {
  /** 登入帳號 */
  帳號 = "";
  /** bcrypt 密碼雜湊 */
  密碼雜湊 = "";
  /** 角色：admin / superadmin */
  角色 = "admin";

  constructor(data: Record<string, unknown> = {}, deletable = true) {
    super(data, deletable);
    this.帳號 = (data?.帳號 as string) ?? "";
    this.密碼雜湊 = (data?.密碼雜湊 as string) ?? "";
    this.角色 = (data?.角色 as string) ?? "admin";
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      帳號: this.帳號,
      角色: this.角色,
      // 密碼雜湊永不曝露
    };
  }
}
