import { assert, assertEquals, assertNotEquals } from "@std/assert";
import MultilingualString from "../implementations/string.ts";
import { registerTranslation, clearTranslation } from "../core/translation.ts";
import type { TranslationInterface } from "../core/translation.ts";

async function shouldRunNetTranslationTest(): Promise<boolean> {
  const envPerm = await Deno.permissions.query({ name: "env" });
  if (envPerm.state !== "granted") return false;
  if (Deno.env.get("ALLOW_NET_TRANSLATION") !== "1") return false;
  const netPerm = await Deno.permissions.query({ name: "net" });
  return netPerm.state === "granted";
}

class StubTranslation implements TranslationInterface {
  public calls = 0;
  translate(_from: string, to: string, text: string): Promise<string> {
    this.calls += 1;
    return Promise.resolve(`[${to}] ${text}`);
  }
}

Deno.test("MultilingualString translates missing language and caches result", async () => {
  const stub = new StubTranslation();
  registerTranslation(stub);
  try {
    const ml = MultilingualString.from("hello", "en");

    const first = await ml.toStringAsync("zh-tw");
    assertEquals(first, "[zh-tw] hello");
    assertEquals(stub.calls, 1);

    // 第二次取得相同語言，應使用快取，不再呼叫翻譯服務
    const second = await ml.toStringAsync("zh-tw");
    assertEquals(second, "[zh-tw] hello");
    assertEquals(stub.calls, 1);
  } finally {
    clearTranslation();
  }
});

Deno.test("MultilingualString translates arbitrary text (e.g., svg markup) and caches", async () => {
  const stub = new StubTranslation();
  registerTranslation(stub);
  try {
    const svgLike = `<svg><text>Hello</text></svg>`;
    const ml = new MultilingualString({ en: svgLike });

    const first = await ml.toStringAsync("zh-tw");
    assertEquals(first, `[zh-tw] ${svgLike}`);
    assertEquals(stub.calls, 1);

    const second = await ml.toStringAsync("zh-tw");
    assertEquals(second, `[zh-tw] ${svgLike}`);
    assertEquals(stub.calls, 1);
  } finally {
    clearTranslation();
  }
});

Deno.test("MultilingualString uses default Google translation when no service registered (net opt-in)", async () => {
  if (!(await shouldRunNetTranslationTest())) {
    return; // 跳過：未開啟 ALLOW_NET_TRANSLATION 或缺權限
  }

  clearTranslation();

  const ml = new MultilingualString({ en: "good morning" });

  const ja = await ml.toStringAsync("ja");
  assert(ja.length > 0);
  assertNotEquals(ja, "good morning");

  const zh = await ml.toStringAsync("zh-tw");
  assert(zh.length > 0);
  assertNotEquals(zh, "good morning");
});

Deno.test("MultilingualString falls back to best source language", async () => {
  const stub = new StubTranslation();
  registerTranslation(stub);
  try {
    // 來源僅有英文，應使用英文作為最佳來源語言
    const ml = new MultilingualString({ en: "good morning" });

    const translated = await ml.toStringAsync("ja");
    assertEquals(translated, "[ja] good morning");
    assertEquals(stub.calls, 1);
  } finally {
    clearTranslation();
  }
});
