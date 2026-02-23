import querystring from "node:querystring";
import generate from "./translateToken.ts";

export class TranslateError extends Error {
  public code: number; // code 可以是特定類型或任意字串

  constructor(message: string, code: number = 0) {
    super(message); // 呼叫父類別 Error 的建構函式
    this.name = "CustomError"; // 設定錯誤名稱
    this.code = code; // 添加自訂的 code 屬性

    // 保持堆疊追蹤正確（如果環境支援，例如 Deno/Node.js）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TranslateError);
    }
  }
}
export default async function googleTranslate(
  from: 支援的語言,
  to: 支援的語言,
  text: string,
) {
  // Generate Google Translate token for the text to be translated.
  const token = await generate(text);
  if (token === undefined || token === null) {
    throw new TranslateError("Google Translate token generation failed.", 500);
  }
  // URL & query string required by Google Translate.
  const baseUrl = "https://translate.google.com/translate_a/single";
  const data = {
    client: "gtx",
    sl: from,
    tl: to,
    hl: to,
    dt: ["at", "bd", "ex", "ld", "md", "qca", "rw", "rm", "ss", "t"],
    ie: "UTF-8",
    oe: "UTF-8",
    otf: 1,
    ssel: 0,
    tsel: 0,
    kc: 7,
    q: text,
    [token.name]: token.value,
  } as { [key: string]: any };

  // Append query string to the request URL.
  const url = `${baseUrl}?${querystring.stringify(data)}`;

  let response;
  // If request URL is greater than 2048 characters, use POST method.
  if (url.length > 2048 && data.q) {
    // 處理 POST 請求
    delete data.q;
    const postUrl = `${baseUrl}?${querystring.stringify(data)}`;
    response = await fetch(postUrl, {
      method: "POST",
      body: new URLSearchParams({ q: text }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });
  } else {
    // 處理 GET 請求
    response = await fetch(url);
  }
  const body = await response.json();
  const result = {
    text: "",
    from: {
      language: { didYouMean: false, iso: "" },
      text: { autoCorrected: false, value: "", didYouMean: false },
    },
    raw: "",
  };
  // Parse body and add it to the result object.
  body[0].forEach((obj: string[]) => {
    if (obj[0]) {
      result.text += obj[0];
    }
  });

  if (body[2] === body[8][0][0]) {
    result.from.language.iso = body[2];
  } else {
    result.from.language.didYouMean = true;
    result.from.language.iso = body[8][0][0];
  }

  if (body[7] && body[7][0]) {
    let str = body[7][0];

    str = str.replace(/<b><i>/g, "[");
    str = str.replace(/<\/i><\/b>/g, "]");

    result.from.text.value = str;

    if (body[7][5] === true) {
      result.from.text.autoCorrected = true;
    } else {
      result.from.text.didYouMean = true;
    }
  }

  return result;
}
