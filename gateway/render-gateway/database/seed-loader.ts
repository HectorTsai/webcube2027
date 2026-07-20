// 種子資料讀取器 — 從 /database/seeds/ 載入初始資料
import { 資料 } from './base-model.ts';
import SecretString from './secretstring.ts';

/** 讀取一顆種子 — 處理單一 JSON 檔案 */
async function 讀取一顆種子(filePath: string | URL): Promise<Record<string, unknown>[]> {
  try {
    let path: string;
    if (filePath instanceof URL && filePath.protocol === 'file:') {
      path = filePath.pathname;
    } else {
      path = filePath as string;
    }

    const text = await Deno.readTextFile(path);
    const raw = JSON.parse(text) as Record<string, unknown>[];
    return Array.isArray(raw) ? raw : [raw];
  } catch (_err) {
    return [];
  }
}

/** 讀取目錄種子 — 遞迴讀取目錄下的所有 JSON 檔案 */
async function 讀取目錄種子(
  currentDir: URL,
  model: string,
  所有資料: Record<string, unknown>[],
  relativePath: string = ''
): Promise<void> {
  for await (const entry of Deno.readDir(currentDir)) {
    if (entry.isFile && entry.name.endsWith('.json')) {
      const filePath = `./database/seeds/${model}${relativePath}/${entry.name}`;
      const 檔案資料 = await 讀取一顆種子(filePath);
      所有資料.push(...檔案資料);
    } else if (entry.isDirectory) {
      const subDirUrl = new URL(entry.name + '/', currentDir);
      await 讀取目錄種子(subDirUrl, model, 所有資料, `${relativePath}/${entry.name}`);
    }
  }
}

/** 讀取種子 — 主要函數，從 /database/seeds/ 載入指定 model 的初始資料 */
export async function 讀取種子<T extends 資料>(model: string): Promise<T[] | null> {
  try {
    const 所有資料: Record<string, unknown>[] = [];

    // 1. 檢查單一檔案 model.json
    try {
      const seedPath = `./database/seeds/${model}.json`;
      const 單一檔案資料 = await 讀取一顆種子(seedPath);
      if (單一檔案資料 && 單一檔案資料.length > 0) {
        所有資料.push(...單一檔案資料);
      }
    } catch (_錯誤) {
      // 單一檔案不存在，繼續檢查目錄
    }

    // 2. 檢查目錄 model/ 下的所有 JSON 檔案
    try {
      const dirPath = new URL(`./seeds/${model}/`, import.meta.url);
      const dirInfo = await Deno.stat(dirPath);
      if (dirInfo.isDirectory) {
        await 讀取目錄種子(dirPath, model, 所有資料);
      }
    } catch (_錯誤) {
      // 目錄不存在或沒有檔案
    }

    if (所有資料.length === 0) return null;

    // 載入模型並轉換
  try {
    const mod = await import(`./models/${model}.ts`);
    const Model = mod.default;
    const result = 所有資料.map((item) => new Model(item));

      // 對所有 SecretString 欄位觸發加密，確保寫入 DB 時為密文
      for (const instance of result) {
        for (const value of Object.values(instance as Record<string, unknown>)) {
          if (value instanceof SecretString) {
            await value.process();
          }
        }
      }

      return result;
    } catch (modelErr) {
      console.error(`[讀取種子] 模型實例化失敗: ${model}`, modelErr);
      return null;
    }
  } catch (err) {
    console.error(`讀取種子失敗: ${model}`, err);
    return null;
  }
}
