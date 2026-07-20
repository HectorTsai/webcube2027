import { assertEquals } from "@std/assert";
import { MultilingualString } from "./mod.ts";

Deno.test("mod 匯出 MultilingualString", () => {
  const str = new MultilingualString({ en: "Hello" });
  assertEquals(str.getText("en"), "Hello");
});
