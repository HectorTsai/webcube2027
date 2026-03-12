// SecretString 類別（簡化版）
export default class SecretString {
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
