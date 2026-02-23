/**
 * Google Translate Token Generator
 *
 * 這個模組用於生成 Google 翻譯 API 所需的驗證令牌。
 * 此實現基於 Google 翻譯網頁版的 token 生成算法。
 *
 * 最後更新: 2024/01/24
 * 原始碼參考: https://translate.google.com/
 */

// 配置緩存
const tokenConfig = new Map<string, string>();

// 全局狀態
const globalState = {
  tokenKey: tokenConfig.get("TKK") || "0",
};

// 當前 token 緩存
let cachedTokenKey: string | null = null;

/**
 * 創建一個返回固定字符的函數
 */
const createCharProvider = (char: string): () => string => {
  return (): string => char;
};

/**
 * 執行 token 加密的位運算
 */
const performBitOperations = (
  value: number,
  operationString: string,
): number => {
  for (let i = 0; i < operationString.length - 2; i += 3) {
    const operator = operationString[i];
    const shiftOperator = operationString[i + 1];
    const shiftValue = operationString[i + 2];

    // 計算位移值
    const shiftAmount = shiftValue >= "a"
      ? shiftValue.charCodeAt(0) - 87
      : Number(shiftValue);

    // 執行位移操作
    const shiftedValue = shiftOperator === "+"
      ? value >>> shiftAmount
      : value << shiftAmount;

    // 執行位運算
    value = operator === "+"
      ? value + shiftedValue & 0xFFFFFFFF
      : value ^ shiftedValue;
  }
  return value;
};

/**
 * 將字符串轉換為 UTF-8 字節數組
 */
const stringToUtf8Bytes = (text: string): number[] => {
  const bytes: number[] = [];
  let byteIndex = 0;

  for (let charIndex = 0; charIndex < text.length; charIndex++) {
    let charCode = text.charCodeAt(charIndex);

    // 處理 ASCII 字符
    if (charCode < 128) {
      bytes[byteIndex++] = charCode;
    } // 處理 2 字節字符
    else if (charCode < 2048) {
      bytes[byteIndex++] = charCode >> 6 | 0b11000000;
      bytes[byteIndex++] = charCode & 0b00111111 | 0b10000000;
    } // 處理代理對（4 字節 UTF-16 字符）
    else if (
      (charCode & 0xFC00) === 0xD800 &&
      charIndex + 1 < text.length &&
      (text.charCodeAt(charIndex + 1) & 0xFC00) === 0xDC00
    ) {
      // 計算代理對的 Unicode 碼點
      charCode = 0x10000 +
        ((charCode & 0x03FF) << 10) +
        (text.charCodeAt(++charIndex) & 0x03FF);

      // 轉換為 4 字節 UTF-8
      bytes[byteIndex++] = charCode >> 18 | 0b11110000;
      bytes[byteIndex++] = charCode >> 12 & 0b00111111 | 0b10000000;
      bytes[byteIndex++] = charCode >> 6 & 0b00111111 | 0b10000000;
      bytes[byteIndex++] = charCode & 0b00111111 | 0b10000000;
    } // 處理 3 字節字符
    else {
      bytes[byteIndex++] = charCode >> 12 | 0b11100000;
      bytes[byteIndex++] = charCode >> 6 & 0b00111111 | 0b10000000;
      bytes[byteIndex++] = charCode & 0b00111111 | 0b10000000;
    }
  }

  return bytes;
};

/**
 * 生成翻譯請求的 token
 */
const generateTranslationToken = (text: string): string => {
  // 使用緩存的 token key 或從全局狀態獲取
  const tokenKey = cachedTokenKey || globalState.tokenKey;

  // 構建 token 前綴
  const tokenPrefix = "&tk=";

  // 解析 token key
  const [keyPart1, keyPart2 = "0"] = tokenKey.split(".");
  const keyNum1 = Number(keyPart1) || 0;
  const keyNum2 = Number(keyPart2) || 0;

  // 將文本轉換為 UTF-8 字節數組
  const textBytes = stringToUtf8Bytes(text);

  // 初始化 token 值
  let tokenValue = keyNum1;

  // 對每個字節進行處理
  for (const byte of textBytes) {
    tokenValue += byte;
    tokenValue = performBitOperations(tokenValue, "+-a^+6");
  }

  // 應用額外的位運算
  tokenValue = performBitOperations(tokenValue, "+-3^+b+-f");

  // 與 key 的第二部分進行異或運算
  tokenValue ^= keyNum2;

  // 處理負數情況
  if (tokenValue < 0) {
    tokenValue = (tokenValue & 0x7FFFFFFF) + 0x80000000;
  }

  // 計算最終的 token 值
  tokenValue %= 1000000;

  // 返回完整的 token 字符串
  return `${tokenPrefix}${tokenValue}.${tokenValue ^ keyNum1}`;
};

/**
 * 從 Google 翻譯網站獲取最新的 token key
 */
async function updateTokenKey(): Promise<void> {
  const currentHour = Math.floor(Date.now() / 3600000);
  const [savedHour] = globalState.tokenKey.split(".").map(Number);

  // 如果 token key 已過期（每小時更新一次）
  if (savedHour !== currentHour) {
    try {
      const response = await fetch("https://translate.google.com");
      const html = await response.text();

      // 從 HTML 中提取 TKK
      const tkkMatch = html.match(/tkk:'(\d+\.\d+)'/);

      if (tkkMatch && tkkMatch[1]) {
        const newTokenKey = tkkMatch[1];

        // 更新全局狀態和緩存
        globalState.tokenKey = newTokenKey;
        tokenConfig.set("TKK", newTokenKey);
        cachedTokenKey = newTokenKey;
      }
    } catch (error) {
      console.error("更新 token key 失敗:", error);
      // 在錯誤情況下保留舊的 token key
    }
  }
}

/**
 * 生成 Google 翻譯 API 所需的 token
 * @param text 要翻譯的文本
 * @returns 包含 token 名稱和值的對象
 */
export async function generateTranslationTokenForText(text: string): Promise<{
  name: string;
  value: string;
}> {
  try {
    // 確保使用最新的 token key
    await updateTokenKey();

    // 生成並返回 token
    const fullToken = generateTranslationToken(text);
    const tokenValue = fullToken.replace("&tk=", "");

    return {
      name: "tk",
      value: tokenValue,
    };
  } catch (error) {
    console.error("生成翻譯 token 失敗:", error);
    throw new Error("無法生成翻譯 token");
  }
}

// 預設導出
export default generateTranslationTokenForText;
