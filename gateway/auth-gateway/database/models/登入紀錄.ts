/**
 * 登入紀錄 Model — 記錄使用者登入/登出事件
 *
 * ID 格式：使用者:登入紀錄:{nanoid}（由 BaseModel 自動產生）
 * 寫入目標：L2（系統使用者）或 L3（租戶使用者）的 data-gateway CRUD
 */

import { BaseModel, BaseModelInterface } from "@dui/database";

export interface 登入紀錄介面 extends BaseModelInterface {
  id: string;
  帳號: string;
  租戶?: string;
  層級: 'L2' | 'L3';
  事件: 'login' | 'logout';
  ip?: string;
  登入時間: string;
}

export class 登入紀錄 extends BaseModel implements 登入紀錄介面 {
  帳號: string;
  租戶?: string;
  層級: 'L2' | 'L3';
  事件: 'login' | 'logout';
  ip?: string;
  登入時間: string;

  constructor(data: Partial<登入紀錄介面> = {}) {
    super(data);
    this.setIdentity('使用者', '登入紀錄');
    this.帳號 = data.帳號 ?? '';
    this.租戶 = data.租戶;
    this.層級 = data.層級 ?? 'L2';
    this.事件 = data.事件 ?? 'login';
    this.ip = data.ip;
    this.登入時間 = data.登入時間 ?? new Date().toISOString();
  }

  override toJSON(): Record<string, unknown> {
    const r = super.toJSON();
    r.帳號 = this.帳號;
    if (this.租戶) r.租戶 = this.租戶;
    r.層級 = this.層級;
    r.事件 = this.事件;
    if (this.ip) r.ip = this.ip;
    r.登入時間 = this.登入時間;
    return r;
  }
}