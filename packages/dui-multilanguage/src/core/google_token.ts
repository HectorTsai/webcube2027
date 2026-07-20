/**
 * Google Translate Token Generator
 * 以 Deno 環境為基礎的實作，負責取得 translate_a/single 所需 tk 參數。
 */

const tokenCache = new Map<string, string>();

const globalState = {
  tokenKey: tokenCache.get("TKK") || "0",
};

let cachedTokenKey: string | null = null;

const performBitOperations = (
  value: number,
  operationString: string,
): number => {
  for (let i = 0; i < operationString.length - 2; i += 3) {
    const operator = operationString[i];
    const shiftOperator = operationString[i + 1];
    const shiftValue = operationString[i + 2];

    const shiftAmount = shiftValue >= "a"
      ? shiftValue.charCodeAt(0) - 87
      : Number(shiftValue);

    const shiftedValue = shiftOperator === "+"
      ? value >>> shiftAmount
      : value << shiftAmount;

    value = operator === "+"
      ? (value + shiftedValue) & 0xFFFFFFFF
      : value ^ shiftedValue;
  }
  return value;
};

const stringToUtf8Bytes = (text: string): number[] => {
  const bytes: number[] = [];
  let byteIndex = 0;

  for (let charIndex = 0; charIndex < text.length; charIndex++) {
    let charCode = text.charCodeAt(charIndex);

    if (charCode < 128) {
      bytes[byteIndex++] = charCode;
    } else if (charCode < 2048) {
      bytes[byteIndex++] = charCode >> 6 | 0b11000000;
      bytes[byteIndex++] = charCode & 0b00111111 | 0b10000000;
    } else if (
      (charCode & 0xFC00) === 0xD800 &&
      charIndex + 1 < text.length &&
      (text.charCodeAt(charIndex + 1) & 0xFC00) === 0xDC00
    ) {
      charCode = 0x10000 +
        ((charCode & 0x03FF) << 10) +
        (text.charCodeAt(++charIndex) & 0x03FF);

      bytes[byteIndex++] = charCode >> 18 | 0b11110000;
      bytes[byteIndex++] = charCode >> 12 & 0b00111111 | 0b10000000;
      bytes[byteIndex++] = charCode >> 6 & 0b00111111 | 0b10000000;
      bytes[byteIndex++] = charCode & 0b00111111 | 0b10000000;
    } else {
      bytes[byteIndex++] = charCode >> 12 | 0b11100000;
      bytes[byteIndex++] = charCode >> 6 & 0b00111111 | 0b10000000;
      bytes[byteIndex++] = charCode & 0b00111111 | 0b10000000;
    }
  }

  return bytes;
};

const generateTranslationToken = (text: string): string => {
  const tokenKey = cachedTokenKey || globalState.tokenKey;
  const [keyPart1, keyPart2 = "0"] = tokenKey.split(".");
  const keyNum1 = Number(keyPart1) || 0;
  const keyNum2 = Number(keyPart2) || 0;
  const textBytes = stringToUtf8Bytes(text);

  let tokenValue = keyNum1;

  for (const byte of textBytes) {
    tokenValue += byte;
    tokenValue = performBitOperations(tokenValue, "+-a^+6");
  }

  tokenValue = performBitOperations(tokenValue, "+-3^+b+-f");
  tokenValue ^= keyNum2;

  if (tokenValue < 0) {
    tokenValue = (tokenValue & 0x7FFFFFFF) + 0x80000000;
  }

  tokenValue %= 1_000_000;
  return `&tk=${tokenValue}.${tokenValue ^ keyNum1}`;
};

const GOOGLE_TRANSLATE_HOME = "https://translate.google.com";

async function updateTokenKey(): Promise<void> {
  const currentHour = Math.floor(Date.now() / 3_600_000);
  const [savedHour] = globalState.tokenKey.split(".").map(Number);

  if (savedHour !== currentHour) {
    try {
      const response = await fetch(GOOGLE_TRANSLATE_HOME);
      const html = await response.text();
      const tkkMatch = html.match(/tkk:'(\d+\.\d+)'/i);

      if (tkkMatch && tkkMatch[1]) {
        const newTokenKey = tkkMatch[1];
        globalState.tokenKey = newTokenKey;
        tokenCache.set("TKK", newTokenKey);
        cachedTokenKey = newTokenKey;
      }
    } catch (error) {
      console.error("[GoogleToken] 更新 token key 失敗", error);
    }
  }
}

export async function generateGoogleTranslateToken(text: string): Promise<{
  name: string;
  value: string;
}> {
  await updateTokenKey();
  const fullToken = generateTranslationToken(text);
  const tokenValue = fullToken.replace("&tk=", "");

  return {
    name: "tk",
    value: tokenValue,
  };
}

export default generateGoogleTranslateToken;
