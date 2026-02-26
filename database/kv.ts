// 簡單的 Deno KV 封裝，資料放在 data 目錄
// 提示：Deno KV 目前為 unstable API，執行時需 `deno run -A --unstable-kv` 或 Deno 1.42+ 默認允許。
// 這裡用最小型別宣告來避免型別錯誤。
// deno-lint-ignore no-explicit-any
declare const Deno: any;

// deno-lint-ignore no-explicit-any
export async function openKV(): Promise<any> {
  const kv = await Deno.openKv("data/kv.sqlite3");
  return kv;
}

// deno-lint-ignore no-explicit-any
export async function getValue(kv: any, key: string): Promise<unknown | null> {
  const res = await kv.get([key]);
  return res.value ?? null;
}

// deno-lint-ignore no-explicit-any
export async function setValue(kv: any, key: string, value: unknown) {
  await kv.set([key], value);
}
