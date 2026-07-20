import { encrypt, decrypt } from "./crypto.ts";

/**
 * Encrypted string wrapper using AES-GCM.
 *
 * Automatically encrypts plaintext on access and decrypts ciphertext on retrieval.
 * The encryption key is resolved automatically via `ensureKey()`.
 *
 * @example
 * ```ts
 * class Config extends BaseModel {
 *   apiKey = new SecretString("");
 * }
 * ```
 */
export default class SecretString {
  private plaintext?: string = "";
  private ciphertext?: string = "";

  public constructor(options?: { plainText?: string, cipherText?: string | undefined | null }) {
    if (options?.plainText) this.plaintext = options.plainText;
    if (!options?.plainText && options?.cipherText && typeof options.cipherText === 'string') {
      this.ciphertext = options.cipherText; // avoid mixing plainText and cipherText
    }
  }

  /** Get the decrypted plaintext value. */
  public async getPlainText(): Promise<string> {
    await this.process();
    return this.plaintext ?? "";
  }
  /** Set a new plaintext value (will be encrypted on next access). */
  public async setPlainText(text: string): Promise<void> {
    this.plaintext = text;
    this.ciphertext = undefined;
    await this.process();
  }

  /** Get the encrypted ciphertext value. */
  public async getCipherText(): Promise<string> {
    await this.process();
    return this.ciphertext ?? "";
  }
  /** Set an existing ciphertext value (will be decrypted on next access). */
  public async setCipherText(text: string): Promise<void> {
    this.ciphertext = text;
    this.plaintext = undefined;
    await this.process();
  }

  /** Synchronize plaintext and ciphertext (encrypt or decrypt as needed). */
  public async process(): Promise<void> {
    try {
      if (!this.ciphertext && this.plaintext) this.ciphertext = await encrypt(this.plaintext);
      if (!this.plaintext && this.ciphertext) this.plaintext = await decrypt(this.ciphertext);
    } catch (error) {
      console.error("[secretstring process error]", error);
    }
  }

  /** Get plaintext synchronously (only valid after process() has been called). */
  public get PlainText(): string { return this.plaintext ?? ""; }
  public set PlainText(text: string) { this.plaintext = text; this.ciphertext = undefined; }

  /** Get ciphertext synchronously (only valid after process() has been called). */
  public get CipherText(): string { return this.ciphertext ?? ""; }
  public set CipherText(text: string) { this.ciphertext = text; this.plaintext = undefined; }

  /** Safe string representation — does not leak plaintext. */
  public toString(): string { return "[SecretString]"; }

  /** JSON serialization — does not leak plaintext. */
  public toJSON(): string { return this.toString(); }

  /** Get the encrypted ciphertext (async). */
  public async toEncryptedString(): Promise<string> {
    if (!this.ciphertext && this.plaintext) {
      await this.process();
    }
    return this.ciphertext ?? "";
  }
}
