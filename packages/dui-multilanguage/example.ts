import {
  MultilingualString,
  MultilingualSmartContent,
  SmartContent,
  registerTranslation,
  type TranslationInterface,
} from "./mod.ts";

// 自訂翻譯服務範例
class MyTranslationService implements TranslationInterface {
  translate(from: string, to: string, text: string, _host?: string): Promise<string> {
    console.log(`翻譯 ${from} -> ${to}: ${text}`);
    if (from === to) return Promise.resolve(text);
    return Promise.resolve(`[${to}] ${text}`);
  }
}

async function main() {
  // 註冊自訂翻譯服務
  registerTranslation(new MyTranslationService());
  
  // 建立多國語言字串
  const mlString = new MultilingualString({
    "en": "Hello World",
    "zh-tw": "你好世界",
    "ja": "こんにちは世界",
    "ko": "안녕하세요 세계",
  });
  
  console.log("英文:", mlString["en"]);
  console.log("中文:", mlString["zh-tw"]);
  
  // 翻譯成日文
  const japaneseText = await mlString.toStringAsync("ja");
  console.log("日文翻譯:", japaneseText);

  // 翻譯成越南語（原本沒有的語言，會觸發翻譯並快取）
  const vietnameseText = await mlString.toStringAsync("vi");
  console.log("越南語翻譯:", vietnameseText);

  // 智慧內容示範：自動判定 Markdown 並可渲染/翻譯
  const smartContent = new SmartContent({ format: "TEXT", content: "# Hello SmartContent" });
  await smartContent.fetchAsync();
  console.log("SmartContent 原始格式:", smartContent.format);

  // 多國語言智慧內容：文字/Markdown 會翻譯並快取，SVG/二進位不翻譯
  const mlSmart = new MultilingualSmartContent({ en: smartContent });
  const zhText = await mlSmart.toStringAsync("zh-tw");
  console.log("智慧內容中文翻譯:", zhText);

  // 以物件形式直接建立 MultilingualSmartContent（會自動包成 SmartContent）
  const mlSmartInline = new MultilingualSmartContent({
    en: { format: "TEXT", content: "# Inline SmartContent" },
  });
  const zhInline = await mlSmartInline.toStringAsync("zh-tw");
  console.log("智慧內容 (inline) 中文翻譯:", zhInline);
}

if (import.meta.main) {
  main().catch(console.error);
}
