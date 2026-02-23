import 單字 from "../database/models/單字.ts";
import googleTranslate from "../services/googleTranslate.ts";

export default async function 翻譯(
  host: string,
  from: 支援的語言,
  to: 支援的語言,
  text: string,
) {
  if (!text || !from || !to) return text;
  if (from === to) return text;

  const query: Record<string, any> = {};
  text = text.toLowerCase();
  let translated: string = "";
  query[`資料.${from}`] = text;
  // 先搜尋單字
  translated = await dbTrans(from, to, text);
  if (!translated) { // Google 翻譯
    try {
      const r = await googleTranslate(from, to, text);
      // 儲存單字
      translated = r.text;
      const w = await 單字.find(query).first();
      if (w) {
        w.資料[to] = r.text;
        w.最後讀取 = new Date();
        await w.儲存();
      } else {
        console.log("新增單字:" + text);
        const w: 單字 = new 單字({
          資料: { [from]: text, [to]: r.text },
          最後讀取: new Date(),
        });
        await w.儲存();
      }
    } catch (error) {
      console.error("[翻譯]:", (error as any).message);
      return text;
    }
  }
  return translated;
}

async function dbTrans(
  from: 支援的語言,
  to: 支援的語言,
  text: string,
) {
  const query: Record<string, any> = {};
  query[`資料.${from}`] = text;
  let translated: string = "";
  const w = await 單字.find(query).first();
  if (w && w.資料[to]) {
    translated = w.資料[to];
    const diffInHours = Math.abs(Date.now() - w.最後讀取.getTime()) / 60000;
    if (translated && diffInHours > 30) {
      w.最後讀取 = new Date();
      await w.儲存();
    }
    return translated;
  }
  return "";
}
