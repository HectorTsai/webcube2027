/**
 * WebCube2027 檔案路由器
 * 設計目標：易抽離為獨立套件，支援 Hono 整合
 * 功能：掃描指定目錄的 .tsx/.ts 檔案，自動產生路由對應
 */

import type { Context } from 'hono'

/** 路由項目定義 */
export interface 路由項目 {
  /** 檔案路徑（相對於掃描根目錄） */
  檔案路徑: string
  /** URL 路徑模式 */
  路徑: string
  /** 處理函式（預設 export）- 支援多種簽名 */
  處理函式: Function
  /** HTTP 方法陣列 */
  方法: string[]
  /** 參數名稱（來自檔案名稱） */
  參數?: string[]
  /** 是否為特殊檔案 */
  是特殊檔案?: boolean
}

/** 路由器選項 */
export interface 路由器選項 {
  /** 掃描根目錄，預設 'src/routes' */
  掃描目錄?: string
  /** 是否監看檔案變更，預設 false */
  監看?: boolean
  /** 快取過期時間（毫秒），0 表示不過期，預設 0 */
  快取過期時間?: number
  /** 忽略的檔案/目錄模式，預設 ['_', '.'] */
  忽略模式?: string[]
  /** 支援的副檔名，預設 ['.tsx', '.ts'] */
  副檔名?: string[]
}

/** 路由器核心類別 */
export class 檔案路由器 {
  private 選項: Required<路由器選項>
  private 路由表 = new Map<string, 路由項目>()
  private 快取時間 = new Map<string, number>()
  private 監看器?: Deno.FsWatcher

  constructor(選項: 路由器選項 = {}) {
    this.選項 = {
      掃描目錄: 選項.掃描目錄 ?? 'src/routes',
      監看: 選項.監看 ?? false,
      快取過期時間: 選項.快取過期時間 ?? 0,
      忽略模式: 選項.忽略模式 ?? ['_', '.'],
      副檔名: 選項.副檔名 ?? ['.tsx', '.ts'],
    }
  }

  /** 初始化路由器：掃描檔案並建立監看器 */
  async 初始化(): Promise<void> {
    await this.掃描檔案()
    if (this.選項.監看) {
      this.建立監看器()
    }
  }

  /** 掃描檔案並建立路由表 */
  private async 掃描檔案(): Promise<void> {
    try {
      const stat = await Deno.stat(this.選項.掃描目錄)
      if (!stat.isDirectory) {
        console.warn(`[router] 掃描目錄不存在: ${this.選項.掃描目錄}`)
        return
      }
    } catch {
      console.warn(`[router] 掃描目錄不存在: ${this.選項.掃描目錄}`)
      return
    }

    const 檔案清單 = await this.取得檔案清單(this.選項.掃描目錄)
    const 新路由表 = new Map<string, 路由項目>()

    for (const 檔案路徑 of 檔案清單) {
      try {
        const 路由項目 = await this.解析路由項目(檔案路徑)
        if (路由項目) {
          新路由表.set(路由項目.路徑, 路由項目)
        }
      } catch (錯誤) {
        console.error(`[router] 解析路由失敗 ${檔案路徑}:`, 錯誤)
      }
    }

    this.路由表 = 新路由表
    console.info(`[router] 已載入 ${this.路由表.size} 個路由`)
  }

  /** 遞迴取得檔案清單 */
  private async 取得檔案清單(目錄: string): Promise<string[]> {
    const 結果: string[] = []
    
    for await (const 項目 of Deno.readDir(目錄)) {
      const 完整路徑 = `${目錄}/${項目.name}`
      
      // 忽略指定模式
      if (this.選項.忽略模式.some(模式 => 項目.name.startsWith(模式))) {
        continue
      }

      if (項目.isDirectory) {
        const 子檔案 = await this.取得檔案清單(完整路徑)
        結果.push(...子檔案)
      } else if (this.選項.副檔名.some(副檔名 => 項目.name.endsWith(副檔名))) {
        結果.push(完整路徑)
      }
    }

    return 結果
  }

  /** 解析單一檔案為路由項目 */
  private async 解析路由項目(檔案路徑: string): Promise<路由項目 | null> {
    const 相對路徑 = 檔案路徑.slice(this.選項.掃描目錄.length + 1)
    
    // 過濾特殊檔案
    const 檔案名稱 = 相對路徑.split('/').pop()?.replace(/\.(tsx?|ts)$/, '')
    const 是特殊檔案 = 檔案名稱 && 檔案名稱.startsWith('_')
    
    if (是特殊檔案) {
      console.log(`[router] 發現特殊檔案: ${相對路徑}`)
    }
    
    const 路徑 = this.檔案路徑轉路由路徑(相對路徑)
    const 參數 = this.提取參數(相對路徑)

    console.log(`[router] 解析檔案: ${相對路徑} -> 路徑: ${路徑}`)

    // 動態載入模組
    const 模組 = await import(`../../${檔案路徑}`)
    const 處理函式 = 模組.default

    if (typeof 處理函式 !== 'function') {
      console.warn(`[router] 檔案缺少預設導出函式: ${檔案路徑}`)
      return null
    }

    return {
      檔案路徑: 相對路徑,
      路徑,
      處理函式,
      方法: ['GET'],
      參數,
      是特殊檔案: !!是特殊檔案,
    }
  }

  /** 將檔案路徑轉為路由路徑 */
  private 檔案路徑轉路由路徑(檔案路徑: string): string {
    // 移除副檔名
    const 無副檔名 = 檔案路徑.replace(/\.(tsx?|ts)$/, '')
    
    // 處理索引檔案
    if (無副檔名 === 'index') {
      return '/' // 根目錄的 index.tsx
    }
    if (無副檔名.endsWith('/index')) {
      const 目錄路徑 = 無副檔名.slice(0, -6) // 移除 '/index'
      return 目錄路徑 || '/' // 根目錄回傳 '/'
    }

    // 處理動態參數（方括號語法）
    const 處理後 = 無副檔名.replace(/\[([^\]]+)\]/g, ':$1')
    return '/' + 處理後
  }

  /** 從檔案路徑提取參數名稱 */
  private 提取參數(檔案路徑: string): string[] {
    const 參數: string[] = []
    const 匹配 = 檔案路徑.matchAll(/\[([^\]]+)\]/g)
    for (const [, 名稱] of 匹配) {
      參數.push(名稱)
    }
    return 參數
  }

  /** 建立檔案監看器 */
  private 建立監看器(): void {
    try {
      this.監看器 = Deno.watchFs(this.選項.掃描目錄, { recursive: true })
      
      ;(async () => {
        for await (const 事件 of this.監看器!) {
          if (事件.kind === 'modify' || 事件.kind === 'create' || 事件.kind === 'remove') {
            console.info(`[router] 檔案變更，重新掃描...`)
            await this.掃描檔案()
          }
        }
      })()
    } catch (錯誤) {
      console.error(`[router] 監看器建立失敗:`, 錯誤)
    }
  }

  /** 根據路徑查找路由項目 */
  查找路由(路徑: string): 路由項目 | null {
    // 檢查快取
    if (this.選項.快取過期時間 > 0) {
      const 快取時間 = this.快取時間.get(路徑)
      if (快取時間 && Date.now() - 快取時間 < this.選項.快取過期時間) {
        return this.路由表.get(路徑) ?? null
      }
    }

    // 更新快取時間
    this.快取時間.set(路徑, Date.now())
    
    return this.路由表.get(路徑) ?? null
  }

  /** 取得所有路由項目（除錯用） */
  取得所有路由(): 路由項目[] {
    return Array.from(this.路由表.values())
  }

  /** 關閉路由器並清理資源 */
  關閉(): void {
    if (this.監看器) {
      this.監看器.close()
      this.監看器 = undefined
    }
    this.路由表.clear()
    this.快取時間.clear()
  }
}

/** 工廠函式：建立並初始化路由器 */
export async function 建立路由器(選項: 路由器選項 = {}): Promise<檔案路由器> {
  const 路由器 = new 檔案路由器(選項)
  await 路由器.初始化()
  return 路由器
}
