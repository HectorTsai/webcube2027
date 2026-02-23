export default class 密碼中心 {
  public static salt: string = "webcube2026@!$%^&*()_+=-堃";

  private static async deriveKeyFromPassword(
    password: string,
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // 使用 PBKDF2 進行安全金鑰派生
    const salt = encoder.encode(密碼中心.salt);
    const baseKey = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
  }

  public static async 加密(資料: string, 密碼: string): Promise<string> {
    if (!資料 || !密碼) return "";

    try {
      const key = await 密碼中心.deriveKeyFromPassword(密碼);
      // 生成一個唯一的初始化向量 (IV)，12位元組 = 16個base64字元
      const iv = crypto.getRandomValues(new Uint8Array(12));
      // 將資料編碼為 Uint8Array
      const encodedData = new TextEncoder().encode(資料);
      // 執行加密
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedData,
      );
      return new Uint8Array(iv.buffer).toBase64() +
        new Uint8Array(encryptedBuffer).toBase64();
    } catch (error) {
      console.error("[密碼中心] 加密失敗:", error);
      throw new Error("加密過程發生錯誤");
    }
  }

  public static async 解密(加密資料: string, 密碼: string): Promise<string> {
    if (!加密資料 || !密碼) return "";

    // 驗證加密資料長度（至少需要IV的16個base64字元）
    if (加密資料.length < 16) {
      throw new Error("加密資料格式錯誤");
    }

    try {
      const key = await 密碼中心.deriveKeyFromPassword(密碼);
      const ivText = 加密資料.substring(0, 16); // 12位元組IV的base64
      const encryptedText = 加密資料.substring(16);
      const encryptedBuffer = new Uint8Array().fromBase64(encryptedText).buffer;
      const iv = new Uint8Array().fromBase64(ivText).buffer;

      // 執行解密
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedBuffer,
      );

      // 將解密後的資料解碼為字串
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error("[密碼中心] 解密失敗:", error);
      throw new Error("解密過程發生錯誤，可能是密碼錯誤或資料損壞");
    }
  }

  // ==================== 非對稱加密 (RSA) ====================

  /**
   * 生成 RSA 金鑰對
   * @param keySize 金鑰長度，預設 2048 位元
   * @returns RSA 金鑰對
   */
  public static async 生成RSA金鑰對(
    keySize: number = 2048,
  ): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: keySize,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: "SHA-256",
      },
      true, // 可提取
      ["encrypt", "decrypt"],
    );
  }

  /**
   * 將 RSA 公鑰匯出為 PEM 格式
   */
  public static async 匯出RSA公鑰(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("spki", publicKey);
    const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
    const exportedAsBase64 = btoa(exportedAsString);
    return `-----BEGIN PUBLIC KEY-----\n${
      exportedAsBase64.match(/.{1,64}/g)?.join("\n")
    }\n-----END PUBLIC KEY-----`;
  }

  /**
   * 將 RSA 私鑰匯出為 PEM 格式
   */
  public static async 匯出RSA私鑰(privateKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
    const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
    const exportedAsBase64 = btoa(exportedAsString);
    return `-----BEGIN PRIVATE KEY-----\n${
      exportedAsBase64.match(/.{1,64}/g)?.join("\n")
    }\n-----END PRIVATE KEY-----`;
  }

  /**
   * 從 PEM 格式匯入 RSA 公鑰
   */
  public static async 匯入RSA公鑰(pemKey: string): Promise<CryptoKey> {
    // 移除 PEM 首尾標記和換行
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pemKey.substring(
      pemHeader.length,
      pemKey.length - pemFooter.length,
    ).replace(/\s/g, "");

    const binaryDer = Uint8Array.from(
      atob(pemContents),
      (c) => c.charCodeAt(0),
    );

    return await crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    );
  }

  /**
   * 從 PEM 格式匯入 RSA 私鑰
   */
  public static async 匯入RSA私鑰(pemKey: string): Promise<CryptoKey> {
    // 移除 PEM 首尾標記和換行
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pemKey.substring(
      pemHeader.length,
      pemKey.length - pemFooter.length,
    ).replace(/\s/g, "");

    const binaryDer = Uint8Array.from(
      atob(pemContents),
      (c) => c.charCodeAt(0),
    );

    return await crypto.subtle.importKey(
      "pkcs8",
      binaryDer.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"],
    );
  }

  /**
   * 使用 RSA 公鑰加密資料
   * @param data 要加密的資料
   * @param publicKey RSA 公鑰
   * @returns base64 編碼的加密資料
   */
  public static async RSA加密(
    data: string,
    publicKey: CryptoKey,
  ): Promise<string> {
    try {
      const encodedData = new TextEncoder().encode(data);
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        publicKey,
        encodedData,
      );
      return new Uint8Array(encryptedBuffer).toBase64();
    } catch (error) {
      console.error("[密碼中心] RSA 加密失敗:", error);
      throw new Error("RSA 加密過程發生錯誤");
    }
  }

  /**
   * 使用 RSA 私鑰解密資料
   * @param encryptedData base64 編碼的加密資料
   * @param privateKey RSA 私鑰
   * @returns 解密後的字串
   */
  public static async RSA解密(
    encryptedData: string,
    privateKey: CryptoKey,
  ): Promise<string> {
    try {
      const encryptedBuffer = new Uint8Array().fromBase64(encryptedData).buffer;
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        encryptedBuffer,
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error("[密碼中心] RSA 解密失敗:", error);
      throw new Error("RSA 解密過程發生錯誤，可能是金鑰不匹配或資料損壞");
    }
  }

  /**
   * 數位簽名 - 使用私鑰簽名資料
   * @param data 要簽名的資料
   * @param privateKey RSA 私鑰
   * @returns base64 編碼的簽名
   */
  public static async 數位簽名(
    data: string,
    privateKey: CryptoKey,
  ): Promise<string> {
    try {
      // 需要生成新的金鑰對用於簽名（使用不同的用途）
      const signingKey = await crypto.subtle.importKey(
        "pkcs8",
        await crypto.subtle.exportKey("pkcs8", privateKey),
        {
          name: "RSA-PSS",
          hash: "SHA-256",
        },
        true,
        ["sign"],
      );

      const encodedData = new TextEncoder().encode(data);
      const signatureBuffer = await crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        signingKey,
        encodedData,
      );
      return new Uint8Array(signatureBuffer).toBase64();
    } catch (error) {
      console.error("[密碼中心] 數位簽名失敗:", error);
      throw new Error("數位簽名過程發生錯誤");
    }
  }

  /**
   * 驗證數位簽名 - 使用公鑰驗證簽名
   * @param data 原始資料
   * @param signature base64 編碼的簽名
   * @param publicKey RSA 公鑰
   * @returns 簽名是否有效
   */
  public static async 驗證簽名(
    data: string,
    signature: string,
    publicKey: CryptoKey,
  ): Promise<boolean> {
    try {
      // 需要生成新的公鑰用於驗證（使用不同的用途）
      const verificationKey = await crypto.subtle.importKey(
        "spki",
        await crypto.subtle.exportKey("spki", publicKey),
        {
          name: "RSA-PSS",
          hash: "SHA-256",
        },
        true,
        ["verify"],
      );

      const encodedData = new TextEncoder().encode(data);
      const signatureBuffer = new Uint8Array().fromBase64(signature).buffer;

      const isValid = await crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        verificationKey,
        signatureBuffer,
        encodedData,
      );
      return isValid;
    } catch (error) {
      console.error("[密碼中心] 驗證簽名失敗:", error);
      return false;
    }
  }

  /**
   * 生成專門用於簽名的 RSA 金鑰對
   */
  public static async 生成簽名金鑰對(
    keySize: number = 2048,
  ): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: keySize,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
  }
}
