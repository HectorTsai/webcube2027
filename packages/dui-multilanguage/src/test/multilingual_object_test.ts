import { assertEquals, assertFalse, assert } from "@std/assert";
import MultilingualObject from "../core/base.ts";
import type { MultilingualData, SupportedLanguage } from "../core/types.ts";

class TestMultilingualObject extends MultilingualObject<string> {
  public constructor(data?: MultilingualData<string>) {
    super(data);
  }

  public exposeTranslate(
    host: string,
    from: SupportedLanguage,
    to: SupportedLanguage,
    text: string,
  ) {
    return this.translate(host, from, to, text);
  }
}

Deno.test("MultilingualObject can set and get values safely", () => {
  const obj = new TestMultilingualObject({ en: "Hello" });

  assertEquals(obj.get("en"), "Hello");
  assertEquals(obj.get("zh-tw"), undefined);

  obj.set("zh-tw", "哈囉");
  assertEquals(obj.get("zh-tw"), "哈囉");

  obj.set("zh-tw", undefined);
  assertEquals(obj.get("zh-tw"), undefined);
  assertFalse(obj.has("zh-tw"));
});

Deno.test("MultilingualObject enumerates available languages and best source", () => {
  const obj = new TestMultilingualObject({ en: "Hello", "zh-tw": "哈囉" });
  obj.set("ja", "こんにちは");

  const langs = obj.getAllAvailableLanguages();
  assert(langs.includes("en" as SupportedLanguage));
  assert(langs.includes("zh-tw" as SupportedLanguage));
  assert(langs.includes("ja" as SupportedLanguage));

  // 根據 SUPPORTED_LANGUAGES 的順序，第一個可用語言應為 zh-tw
  assertEquals(obj.getFirstAvailableLanguage(), "zh-tw");
  assertEquals(obj.findBestSourceLanguage(), "en");
  assertEquals(obj.findBestSourceLanguage("ja" as SupportedLanguage), "ja");
});
