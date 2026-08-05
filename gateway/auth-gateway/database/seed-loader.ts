// 種子資料讀取器 — 從 database/seeds/ 載入初始資料
// 與 render-gateway 的 seed-loader 不同，auth-gateway 不做 Model 實例化
// 直接回傳 JSON 資料陣列，由呼叫端寫入資料庫

/** 讀取指定子路徑下的所有 JSON 種子檔案 */
export async function loadSeeds(subPath: string): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  const dirUrl = new URL(`./seeds/${subPath}/`, import.meta.url);

  // 目錄不存在時靜默回退
  try {
    await Deno.stat(dirUrl);
  } catch {
    return results;
  }

  for await (const entry of Deno.readDir(dirUrl)) {
    if (entry.isFile && entry.name.endsWith('.json')) {
      const fileUrl = new URL(entry.name, dirUrl);
      try {
        const text = await Deno.readTextFile(fileUrl);
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          results.push(...data);
        } else {
          results.push(data);
        }
      } catch {
        // 跳過無法讀取或解析的檔案
        continue;
      }
    }
  }

  return results;
}

/** 遞迴讀取 basePath 下所有子目錄的 JSON 種子檔案 */
export async function loadSeedsRecursive(basePath: string): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  const dirUrl = new URL(`./seeds/${basePath}/`, import.meta.url);

  try {
    await Deno.stat(dirUrl);
  } catch {
    return results;
  }

  for await (const entry of Deno.readDir(dirUrl)) {
    if (!entry.isDirectory) continue;

    const subDirUrl = new URL(entry.name + '/', dirUrl);
    for await (const file of Deno.readDir(subDirUrl)) {
      if (!file.isFile || !file.name.endsWith('.json')) continue;

      const fileUrl = new URL(file.name, subDirUrl);
      try {
        const text = await Deno.readTextFile(fileUrl);
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          results.push(...data);
        } else {
          results.push(data);
        }
      } catch {
        continue;
      }
    }
  }

  return results;
}