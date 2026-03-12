import { 資料 } from "../index.ts"

export default class 網站資訊 implements 資料 {
  public id: string
  public 名稱: string
  public 網址: string
  public 骨架ID?: string
  public 配色ID?: string
  public 佈景主題ID?: string
  public 資料庫?: { getPlainText(): string }

  public constructor(data: Record<string, unknown> = {}) {
    this.id = data?.id as string || ""
    this.名稱 = (data?.名稱 as string) ?? ""
    this.網址 = (data?.網址 as string) ?? ""
    this.骨架ID = data?.骨架ID as string
    this.配色ID = data?.配色ID as string
    this.佈景主題ID = data?.佈景主題ID as string
    // 資料庫欄位是 SecretString 物件
    this.資料庫 = data?.資料庫 as { getPlainText(): string }
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      名稱: this.名稱,
      網址: this.網址,
      骨架ID: this.骨架ID,
      配色ID: this.配色ID,
      佈景主題ID: this.佈景主題ID,
      資料庫: this.資料庫,
    }
  }
}
