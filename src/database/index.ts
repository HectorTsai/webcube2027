import { 資料 } from './kv.ts'

// 權限介面
export interface 權限 {
  讀: boolean
  寫: boolean
  刪除: boolean
}

// 版權資料介面
export interface 版權資料 {
  作者?: string
  年份?: number
  授權?: string
}

// SecretString 類別（簡化版）
export class SecretString {
  private cipherText: string

  constructor(data: { cipherText?: string }) {
    this.cipherText = data.cipherText || ''
  }

  getPlainText(): string {
    // 在實際應用中，這裡會解密
    // 目前返回空字串作為預設
    return this.cipherText
  }

  toJSON(): string {
    return this.cipherText
  }
}

export type { 資料 } from './kv.ts'
