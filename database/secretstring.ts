// deno-lint-ignore no-explicit-any
declare const Deno: any;
import { 加密, 解密 } from "../services/密碼方法.ts";

export default class SecretString {
  private value: string = "";
  private encryptedCache?: string;
  private static secretKey: string = "";

  static {
    SecretString.secretKey = Deno.env.get("SECRET_PASSWORD") ?? "Webcube@2027堃ưสิ자л";
  }

  /** 手動覆寫密鑰（預期少用，提供維運彈性） */
  public static setKey(key: string) {
    SecretString.secretKey = key;
  }

  public async setValue(value:string){
    this.value = value;
    this.encryptedCache = await this.toEncryptedString();
  }

  private constructor(data: string = "", cache?: string) {
    this.value = data;
    this.encryptedCache = cache;
  }

  public static async fromString(data: string) {
    try {
      const result = await 解密(data, this.secretKey);
      return new SecretString(result, data);
    } catch(e){
      console.warn("[secretstring] decrypt failed, fallback to raw string", e);
      try {
        const cypherText = await 加密(data, this.secretKey);
        return new SecretString(data,cypherText);
      } catch (err) {
        console.warn("[secretstring] fallback encrypt failed", err);
        return new SecretString(data);
      }
    }
  }

  /** 加密後的字串（非同步） */
  public async toEncryptedString() {
    const cipher = await 加密(this.value, SecretString.secretKey);
    this.encryptedCache = cipher;
    return cipher;
  }

  // 兼容舊命名
  public async toStringAsync() {
    return await this.toEncryptedString();
  }

  /** 轉為明文字串 */
  public toString(): string {
    return this.value;
  }

  /** 提供同步 JSON 表示，避免洩漏明文。若未先加密，回傳占位字串。 */
  public toJSON(): string {
    return this.encryptedCache ?? "[SecretString]";
  }

  /** 取得加密後的 JSON safe 字串（非同步） */
  public async toJSONAsync(): Promise<string> {
    return await this.toEncryptedString();
  }
}
