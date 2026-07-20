import { assertEquals } from "@std/assert";
import MultilingualSmartContent from "../implementations/smart-content.ts";
import { SmartContent } from "../core/content/smart-content.ts";
import type { TranslationInterface } from "../core/translation.ts";
import { registerTranslation, clearTranslation } from "../core/translation.ts";

class StubTranslation implements TranslationInterface {
  public calls = 0;
  translate(_from: string, to: string, text: string): Promise<string> {
    this.calls += 1;
    return Promise.resolve(`[${to}] ${text}`);
  }
}

Deno.test("MultilingualSmartContent translates text content and caches", async () => {
  const stub = new StubTranslation();
  registerTranslation(stub);
  try {
    const enContent = new SmartContent({ format: "TEXT", content: "hello" });
    const ml = new MultilingualSmartContent({ en: enContent });

    const first = await ml.toStringAsync("zh-tw");
    assertEquals(first, "[zh-tw] hello");
    assertEquals(stub.calls, 1);

    const cached = await ml.toStringAsync("zh-tw");
    assertEquals(cached, "[zh-tw] hello");
    assertEquals(stub.calls, 1);
  } finally {
    clearTranslation();
  }
});

Deno.test("MultilingualSmartContent translates markdown content and preserves format", async () => {
  const stub = new StubTranslation();
  registerTranslation(stub);
  try {
    const enContent = new SmartContent({ format: "MARKDOWN", content: "# Hello" });
    const ml = new MultilingualSmartContent({ en: enContent });

    const translated = await ml.toStringAsync("ja");
    assertEquals(translated, "[ja] # Hello");
    assertEquals(stub.calls, 1);

    const jaContent = ml.getSmartContent("ja" as const);
    assertEquals(jaContent?.format, "MARKDOWN");
  } finally {
    clearTranslation();
  }
});

Deno.test("MultilingualSmartContent does not translate SVG content", async () => {
  const stub = new StubTranslation();
  registerTranslation(stub);
  try {
    const svg = `<svg><text>Hello</text></svg>`;
    const enContent = new SmartContent({ format: "SVG", content: svg });
    const ml = new MultilingualSmartContent({ en: enContent });

    const output = await ml.toStringAsync("zh-tw");
    assertEquals(output, svg);
    assertEquals(stub.calls, 0);

    const zhContent = ml.getSmartContent("zh-tw" as const);
    assertEquals(zhContent?.format, "SVG");
  } finally {
    clearTranslation();
  }
});

Deno.test("MultilingualSmartContent does not translate binary content (e.g., PNG)", async () => {
  const stub = new StubTranslation();
  registerTranslation(stub);
  try {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG magic
    const enContent = new SmartContent({ format: "PNG", content: pngBytes });
    const ml = new MultilingualSmartContent({ en: enContent });

    const output = await ml.toStringAsync("zh-tw");
    // Binary 轉字串會回空字串（依 SmartContent.toString），但不應觸發翻譯
    assertEquals(output, "");
    assertEquals(stub.calls, 0);

    const zhContent = ml.getSmartContent("zh-tw" as const);
    assertEquals(zhContent?.format, "BINARY");
    assertEquals(zhContent?.isBinaryFormat, true);
  } finally {
    clearTranslation();
  }
});
