import { 加密, 解密 } from "../utils/密碼方法.ts";

export default class SecretString {
  private plaintext?: string = "";
  private ciphertext?: string = "";

  public constructor(options?: { plainText?: string, cipherText?: string | undefined | null }) {
    if (options?.plainText) this.plaintext = options.plainText;
    if (!options?.plainText && options?.cipherText && typeof options.cipherText === 'string') {
      this.ciphertext = options.cipherText; // 避免誤用同時傳入 plainText 跟 cipherText，並確保 cipherText 是字串
    }
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

  public async process(){
    try {
      if (!this.ciphertext && this.plaintext) this.ciphertext = await 加密(this.plaintext);
      if (!this.plaintext && this.ciphertext) this.plaintext = await 解密(this.ciphertext);
    } catch (error) {
      console.error("[secretstring process error]",error);
    }
  }

  public get PlainText(): string { return this.plaintext ?? ""; }
  public set PlainText(text:string) { this.plaintext = text; this.ciphertext = undefined; }

  public get CipherText(): string { return this.ciphertext ?? ""; }
  public set CipherText(text:string) { this.ciphertext = text; this.plaintext = undefined; }


  /** 轉為安全字串表示，不洩漏明文 */
  public toString(): string { return "[SecretString]"; }

  /** 提供同步 JSON 表示，避免洩漏明文 */
  public toJSON(): string { return this.toString(); }

  /** 取得加密後的密文（非同步） */
  public async toEncryptedString(): Promise<string> {
    if(!this.ciphertext && this.plaintext) {
      await this.process();
    }
    return this.ciphertext ?? "";
  }
}
