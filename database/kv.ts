// 簡單的 Deno KV 封裝，資料放在 data 目錄
// 提示：Deno KV 目前為 unstable API，執行時需 `deno run -A --unstable-kv` 或 Deno 1.42+ 默認允許。
// 這裡用最小型別宣告來避免型別錯誤。
// deno-lint-ignore no-explicit-any
declare const Deno: any;
import { 資料 } from "./index.ts";

// deno-lint-ignore no-explicit-any
export async function 開啟KV(): Promise<any> {
  const kv = await Deno.openKv("data/kv.sqlite3");
  return kv;
}

function parseTypeFromId(id: string): string | null {
  const parts = id.split(":");
  if (parts.length < 2) return null;
  return parts[1]; // table:type:id 取出 type
}

// deno-lint-ignore no-explicit-any
async function loadModel(type: string): Promise<any> {
  // 動態載入對應模型，路徑相對於本檔案
  const mod = await import(`./models/${type}.ts`);
  return mod.default;
}

// deno-lint-ignore no-explicit-any
export async function 取得資料(kv: any, id: string): Promise<資料 | unknown | null> {
  const res = await kv.get([id]);
  if (!res.value) return null;

  const type = parseTypeFromId(id);
  if (!type) return res.value;

  try {
    const Model = await loadModel(type);
    const instance = new Model(res.value);
    return instance as 資料;
  } catch (_) {
    // 若載入模型失敗，回傳原始值
    return res.value;
  }
}

// deno-lint-ignore no-explicit-any
export async function 寫入資料(kv: any, model: 資料) {
  await kv.set([model.id], model.toJSON());
}
