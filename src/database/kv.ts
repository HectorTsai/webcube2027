// 簡單的 Deno KV 封裝，資料放在 data 目錄
// 提示：Deno KV 目前為 unstable API，執行時需 `deno run -A --unstable-kv` 或 Deno 1.42+ 默認允許。

// 基礎資料介面
export interface 資料 {
  id: string
  toJSON(): Record<string, unknown>
}

function parseTypeFromId(id: string): string | null {
  const parts = id.split(":")
  if (parts.length < 2) return null
  return parts[1] // table:type:id 取出 type
}

async function loadModel(type: string): Promise<unknown> {
  // 動態載入對應模型，路徑相對於本檔案
  const mod = await import(`./models/${type}.ts`)
  return mod.default
}

export class KV資料庫 {
  private kv!: Deno.Kv

  async 開啟(): Promise<void> {
    this.kv = await Deno.openKv("data/kv.sqlite3")
  }

  async 取得資料<T extends 資料>(id: string): Promise<T | unknown | null> {
    const res = await this.kv.get([id])
    if (!res.value) return null

    const type = parseTypeFromId(id)
    if (!type) return res.value

    try {
      const Model = await loadModel(type) as any
      const instance = new Model(res.value)
      return instance as T
    } catch (_) {
      // 若載入模型失敗，回傳原始值
      return res.value
    }
  }

  async 寫入資料(model: 資料): Promise<void> {
    await this.kv.set([model.id], model.toJSON())
  }

  async 個數(model: string): Promise<number> {
    const keys = this.kv.list({ prefix: [] })
    let count = 0
    for await (const entry of keys) {
      const id = entry.key[0] as string
      if (parseTypeFromId(id) === model) {
        count++
      }
    }
    return count
  }

  async 初始化(model: string): Promise<void> {
    const count = await this.個數(model)
    if (count === 0) {
      const seedPath = new URL(`./seeds/${model}.json`, import.meta.url)
      const seedData = JSON.parse(await Deno.readTextFile(seedPath))
      for (const item of seedData) {
        await this.kv.set([item.id], item)
      }
    }
  }
}
