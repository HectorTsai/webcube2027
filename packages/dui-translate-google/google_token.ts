/**
 * Google Translate Token Generator
 * 以 Deno 環境為基礎的實作，負責取得 translate_a/single 所需 tk 參數。
 * 從 dui-multilanguage 抽取為獨立套件。
 */

// ── State Management ──

let currentTokenKey = "0";
let updatePromise: Promise<void> | null = null;
const encoder = new TextEncoder();

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

const generateTranslationToken = (text: string): string => {
  const [keyPart1, keyPart2 = "0"] = currentTokenKey.split(".");
  const keyNum1 = Number(keyPart1) || 0;
  const keyNum2 = Number(keyPart2) || 0;

  // 原生 TextEncoder 取代手動 byte array 計算，速度快數倍
  const textBytes = encoder.encode(text);

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
  return `${tokenValue}.${tokenValue ^ keyNum1}`;
};

const GOOGLE_TRANSLATE_HOME = "https://translate.google.com";

async function fetchTokenKey(): Promise<void> {
  try {
    const response = await fetch(GOOGLE_TRANSLATE_HOME);
    const html = await response.text();
    const tkkMatch = html.match(/tkk:'(\d+\.\d+)'/i);

    if (tkkMatch?.[1]) {
      currentTokenKey = tkkMatch[1];
    }
  } catch (error) {
    console.error("[GoogleToken] 更新 token key 失敗", error);
  }
}

async function ensureTokenKey(): Promise<void> {
  const currentHour = Math.floor(Date.now() / 3_600_000);
  const [savedHour] = currentTokenKey.split(".").map(Number);

  // TKK 缺失或過期時，以 Single-flight 模式發起更新
  if (savedHour !== currentHour) {
    if (!updatePromise) {
      updatePromise = fetchTokenKey().finally(() => {
        updatePromise = null;
      });
    }
    await updatePromise;
  }
}

export async function generateGoogleTranslateToken(text: string): Promise<{
  name: string;
  value: string;
}> {
  await ensureTokenKey();
  const tokenValue = generateTranslationToken(text);

  return {
    name: "tk",
    value: tokenValue,
  };
}

export default generateGoogleTranslateToken;