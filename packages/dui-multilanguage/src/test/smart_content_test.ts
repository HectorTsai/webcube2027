import { assertEquals, assertMatch } from "@std/assert";
import { SmartContent } from "../core/content/smart-content.ts";

const inlineSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
  <rect width="120" height="40" fill="#0f172a" rx="6" />
  <text x="60" y="25" fill="#e2e8f0" font-size="16" text-anchor="middle" font-family="Arial, sans-serif">Hello SVG</text>
</svg>`;

const inlineMarkdown = `# Hello Markdown\n\nThis is a **markdown** sample with a link to [example](https://example.com).`;

/** 建立 stub fetch，避免實際網路請求 */
async function withStubFetch(mapping: Record<string, Response>, fn: () => Promise<void>) {
  const originalFetch: typeof fetch = globalThis.fetch;
  const stub = (...args: Parameters<typeof fetch>): Promise<Response> => {
    const target = args[0];
    let key: string;
    if (target instanceof URL) key = target.toString();
    else if (typeof target === "string") key = target;
    else key = target.url;

    const mapped = mapping[key];
    if (mapped) return Promise.resolve(mapped);
    return originalFetch(...args);
  };

  (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = stub as typeof fetch;
  try {
    await fn();
  } finally {
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = originalFetch;
  }
}

Deno.test("SmartContent fetches data: svg and infers format", async () => {
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(inlineSvg)}`;
  const sc = new SmartContent({ format: "TEXT", content: dataUrl });

  await sc.fetchAsync();

  assertEquals(sc.format, "SVG");
  const content = sc.content as string;
  assertMatch(content, /Hello SVG/);
});

Deno.test("SmartContent fetches remote markdown via fetch and infers MARKDOWN", async () => {
  const url = "https://example.com/remote.md";

  await withStubFetch({
    [url]: new Response(inlineMarkdown, {
      status: 200,
      headers: { "content-type": "text/markdown" },
    }),
  }, async () => {
    const sc = new SmartContent({ format: "TEXT", content: url });

    await sc.fetchAsync();

    assertEquals(sc.format, "MARKDOWN");
    assertEquals(sc.content, inlineMarkdown);
  });
});

Deno.test("SmartContent fetches file:// svg via stub fetch and infers SVG", async () => {
  const url = "file:///tmp/sample.svg";

  await withStubFetch({
    [url]: new Response(inlineSvg, {
      status: 200,
      headers: { "content-type": "image/svg+xml" },
    }),
  }, async () => {
    const sc = new SmartContent({ format: "TEXT", content: url });

    await sc.fetchAsync();

    assertEquals(sc.format, "SVG");
    const content = sc.content as string;
    assertMatch(content, /Hello SVG/);
  });
});

Deno.test("SmartContent fetches file:// markdown via stub fetch and infers MARKDOWN", async () => {
  const url = "file:///tmp/sample.md";

  await withStubFetch({
    [url]: new Response(inlineMarkdown, {
      status: 200,
      headers: { "content-type": "text/markdown" },
    }),
  }, async () => {
    const sc = new SmartContent({ format: "TEXT", content: url });

    await sc.fetchAsync();

    assertEquals(sc.format, "MARKDOWN");
    assertEquals(sc.content, inlineMarkdown);
  });
});
