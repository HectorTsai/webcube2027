// deno-lint-ignore no-explicit-any
declare const Deno: any;
import { 加密, 解密 } from "../services/密碼方法.ts";

export default class SecretString {
  private static secretKey: string = "";
  private plaintext?: string = "";
  private ciphertext?: string = "";
  private key?:string;

  static {
    SecretString.secretKey = Deno.env.get("SECRET_PASSWORD") ?? "Webcube@2027堃ưสิ자л";
  }

  public constructor(options?: { plainText?: string, cipherText?: string, secretKey?: string }) {
    if (options?.plainText) this.plaintext = options.plainText;
    if (!options?.plainText && options?.cipherText) this.ciphertext = options.cipherText; // 避免誤用同時傳入 plainText 跟 cipherText
    if (options?.secretKey) this.key = options.secretKey;
  }

  public async getPlainText() {
    await this.process();
    return this.plaintext ?? "";
  }
  public async setPlainText(text:string){
    this.plaintext = text;
    this.ciphertext = undefined;
    await this.process();
  }

  public async getCipherText() {
    await this.process();
    return this.ciphertext ?? "";
  }
  public async setCipherText(text: string) {
    this.ciphertext = text;
    this.plaintext = undefined;
    await this.process();
  }

  public async setKey(key:string){
    // 如果沒有明文 需先解密，等設定密碼後再重新加密
    if(!this.plaintext && this.ciphertext) {
      await this.process();
    }
    this.key = key;
    this.ciphertext = undefined;
    await this.process();
  }

  public async process(){
    try {
      if (!this.ciphertext && this.plaintext) this.ciphertext = await 加密(this.plaintext, this.key ?? SecretString.secretKey);
      if (!this.plaintext && this.ciphertext) this.plaintext = await 解密(this.ciphertext, this.key ?? SecretString.secretKey);
    } catch (error) {
      console.error("[secretstring process error]",error);
    }
  }

  public get PlainText(): string { return this.plaintext ?? ""; }
  public set PlainText(text:string) { this.plaintext = text; this.ciphertext = undefined; }

  public get CipherText(): string { return this.ciphertext ?? ""; }
  public set CipherText(text:string) { this.ciphertext = text; this.plaintext = undefined; }


  /** 轉為明文字串 */
  public toString(): string { return this.ciphertext ?? "[SecretString]"; }

  /** 提供同步 JSON 表示，避免洩漏明文。若未先加密，回傳占位字串。 */
  public toJSON(): string { return this.toString(); }

  /** 取得加密後的 JSON safe 字串（非同步） */
  public async toJSONAsync(): Promise<string> {
    if(!this.ciphertext && this.plaintext) {
      await this.process();
    }
    return this.toJSON();
  }
}
