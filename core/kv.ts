// deno-lint-ignore-file no-explicit-any
import { info, error } from '../utils/logger.ts';
import 系統資訊 from '../database/models/系統資訊.ts';
import SecretString from '../database/secretstring.ts';
import { 資料, L2連線資訊 } from '../database/index.ts'; // Added for generic methods


// KV 資料庫管理類別
export class KV資料庫 {
  private kvInstance: any = null;
  private 已初始化: boolean = false;

  constructor() {
    // 建構函數保持簡潔
  }

  // 初始化 KV 資料庫
  async 初始化(): Promise<Deno.Kv> {
    try {
      if (!this.kvInstance) {
        // 使用 Deno KV
        if (typeof (Deno as any).openKv === 'function') {
          this.kvInstance = await (Deno as any).openKv('./data/webcube.db');
        } else if (typeof (Deno as any).__unstable_openKv === 'function') {
          this.kvInstance = await (Deno as any).__unstable_openKv('./data/webcube.db');
        } else {
          throw new Error('Deno KV 不可用，請確保使用 --unstable-kv 參數啟動');
        }
        
        await info('KV', 'Deno KV 資料庫連線成功');
        
        // 初始化模型資料
        await this.初始化Model('系統資訊');
        
        // 初始化核心模型作為 L1 預設值（支援三層查詢 fallback）
        await this.初始化Model('語言');
        await this.初始化Model('單字');
        await this.初始化Model('圖示');
        await this.初始化Model('骨架');
        await this.初始化Model('配色');
        await this.初始化Model('佈景主題');
        this.已初始化 = true;
      }
      return this.kvInstance;
    } catch (錯誤) {
      await error('KV', `KV 資料庫連線失敗: ${錯誤}`);
      throw 錯誤;
    }
  }

  // 取得 KV 實例
  async 取得KV(): Promise<Deno.Kv> {
    if (!this.kvInstance) {
      return await this.初始化();
    }
    return this.kvInstance;
  }

  // 初始化模型資料
  async 初始化Model(model: string): Promise<void> {
    try {
      const kv = await this.取得KV();
      
      // 檢查該 model 在資料庫的筆數
      const 模型資料列表 = [];
      for await (const entry of kv.list<string>({ prefix: [model] })) {
        模型資料列表.push(entry);
      }
      const 筆數 = 模型資料列表.length;
      
      if (筆數 === 0) {
        // 讀取 seeds/${model}.json
        try {
          const seed檔案路徑 = `./database/seeds/${model}.json`;
          const seed內容 = await Deno.readTextFile(seed檔案路徑);
          const seed資料 = JSON.parse(seed內容);
          
          if (Array.isArray(seed資料)) {
            // 動態導入模型類別
            let 模型類別: any = null;
            try {
              const 模型模組 = await import(`../database/models/${model}.ts`);
              模型類別 = 模型模組.default;
            } catch (_導入錯誤) {
              // 如果無法導入模型類別，使用原始資料
              await info('KV', `無法導入 ${model} 模型類別，使用原始資料`);
            }
            
            // 將 seed 資料轉換為模型實例並存入 KV
            for (const 資料項目 of seed資料) {
              if (模型類別 && typeof 模型類別 === 'function') {
                try {
                  const 模型實例 = new 模型類別(資料項目, 資料項目.可刪除 || false);
                  await kv.set([model, 模型實例.id], 模型實例.toJSON());
                } catch (實例錯誤) {
                  await error('KV', `建立 ${model} 模型實例失敗，使用原始資料: ${實例錯誤}`);
                  await kv.set([model, 資料項目.id], 資料項目);
                }
              } else {
                // 直接存入原始資料
                await kv.set([model, 資料項目.id], 資料項目);
              }
            }
            await info('KV', `${model} 模型初始化完成，共 ${seed資料.length} 筆資料`);
          } else {
            await error('KV', `${model} seed 資料格式錯誤，應為陣列格式`);
          }
        } catch (檔案錯誤) {
          await error('KV', `讀取 ${model} seed 檔案失敗: ${檔案錯誤}`);
        }
      } else {
        await info('KV', `${model} 模型已有 ${筆數} 筆資料，跳過初始化`);
      }
    } catch (錯誤) {
      await error('KV', `初始化 ${model} 模型失敗: ${錯誤}`);
    }
  }

  // 通用方法：根據 ID 取得模型實例
  async 取得<T extends 資料>(id: string): Promise<T | null> {
    try {
      const kv = await this.取得KV();
      
      // 從 ID 解析出 model 名稱（第二個位置）
      const idParts = id.split(':');
      if (idParts.length < 3) {
        await error('KV', `ID 格式錯誤: ${id}，應為 table:model:uuid 格式`);
        return null;
      }
      
      const table = idParts[0]; // table 名稱在第一個位置
      const model = idParts[1]; // model 名稱在第二個位置
      const result = await kv.get([table, id]);
      
      if (!result.value) {
        return null;
      }
      
      try {
        // 動態導入模型類別
        const 模型模組 = await import(`../database/models/${model}.ts`);
        const 模型類別 = 模型模組.default;
        
        if (!模型類別 || typeof 模型類別 !== 'function') {
          await error('KV', `無法導入模型類別: ${model}`);
          return null;
        }
        
        // 建立模型實例
        const 資料 = result.value as any;
        
        // 特別處理 SecretString 欄位（針對系統資訊）
        if (model === '系統資訊' && 資料.資料庫 && typeof 資料.資料庫 === 'object') {
          // 處理嵌套的 SecretString 結構
          if (資料.資料庫.ciphertext && typeof 資料.資料庫.ciphertext === 'object' && 資料.資料庫.ciphertext.plaintext) {
            資料.資料庫 = 資料.資料庫.ciphertext.plaintext;
          } else if (資料.資料庫.plaintext) {
            資料.資料庫 = 資料.資料庫.plaintext;
          }
        }
        
        const 模型實例 = new 模型類別(資料, 資料.可刪除 || false);
        return 模型實例 as T;
        
      } catch (導入錯誤) {
        await error('KV', `導入模型 ${model} 失敗: ${導入錯誤}`);
        return null;
      }
      
    } catch (錯誤) {
      await error('KV', `取得模型實例失敗: ${錯誤}`);
      return null;
    }
  }

  // 通用方法：取得指定模型的第一個實例
  async 取得一個<T extends 資料>(model: string): Promise<T | null> {
    try {
      const kv = await this.取得KV();
      
      // 取得該模型的第一筆資料
      for await (const entry of kv.list<any>({ prefix: [model] })) {
        if (entry.value && entry.key.length >= 2) {
          // 使用 KV key 中的 ID（第二個元素）
          const id = entry.key[1] as string;
          return await this.取得<T>(id);
        }
      }
      
      return null;
    } catch (錯誤) {
      await error('KV', `取得模型 ${model} 的第一個實例失敗: ${錯誤}`);
      return null;
    }
  }

  // 通用方法：更新模型實例
  async 更新<T extends 資料>(id: string, 資訊: Partial<T>): Promise<boolean> {
    try {
      const kv = await this.取得KV();
      const 現有資料 = await this.取得<T>(id);
      
      if (!現有資料) {
        await error('KV', `模型實例不存在: ${id}`);
        return false;
      }
      
      // 從 ID 解析出 table 和 model 名稱
      const idParts = id.split(':');
      const table = idParts[0]; // table 名稱在第一個位置
      const model = idParts[1]; // model 名稱在第二個位置
      
      try {
        // 動態導入模型類別
        const 模型模組 = await import(`../database/models/${model}.ts`);
        const 模型類別 = 模型模組.default;
        
        // 合併資料
        const 更新後資料 = { ...現有資料.toJSON(), ...資訊 };
        
        // 建立新的模型實例
        const 更新後實例 = new 模型類別(更新後資料, 現有資料.可刪除);
        
        // 存入 KV 資料庫
        await kv.set([table, id], 更新後實例.toJSON());
        await info('KV', `模型 ${model} 更新成功: ${id}`);
        return true;
        
      } catch (導入錯誤) {
        await error('KV', `導入模型 ${model} 失敗: ${導入錯誤}`);
        return false;
      }
      
    } catch (錯誤) {
      await error('KV', `更新模型實例失敗: ${錯誤}`);
      return false;
    }
  }

  // 取得系統資訊（使用新的通用方法）
  async 取得系統資訊(): Promise<系統資訊 | null> {
    return await this.取得<系統資訊>('系統資訊:系統資訊:預設');
  }

  // 更新系統資訊（使用新的通用方法）
  async 更新系統資訊(資訊: Partial<系統資訊>): Promise<boolean> {
    return await this.更新<系統資訊>('系統資訊:系統資訊:預設', 資訊);
  }

  // 設定系統資訊（創建或完全替換）
  async 設定系統資訊(資訊: any): Promise<boolean> {
    try {
      const kv = await this.取得KV();
      
      // 動態導入系統資訊模型類別
      const 模型模組 = await import('../database/models/系統資訊.ts');
      const 系統資訊類別 = 模型模組.default;
      
      // 建立新的系統資訊實例
      const 系統資訊實例 = new 系統資訊類別(資訊, false); // 系統資訊不可刪除
      
      // 存入 KV 資料庫
      await kv.set(['系統資訊', '系統資訊:系統資訊:預設'], 系統資訊實例.toJSON());
      await info('KV', '系統資訊設定成功');
      return true;
      
    } catch (錯誤) {
      await error('KV', `設定系統資訊失敗: ${錯誤}`);
      return false;
    }
  }

  // 刪除系統資訊
  async 刪除系統資訊(): Promise<boolean> {
    try {
      const kv = await this.取得KV();
      
      // 刪除系統資訊
      await kv.delete(['系統資訊', '系統資訊:系統資訊:預設']);
      await info('KV', '系統資訊刪除成功');
      return true;
      
    } catch (錯誤) {
      await error('KV', `刪除系統資訊失敗: ${錯誤}`);
      return false;
    }
  }

  // 取得 L2 連線資訊
  async 取得L2連線資訊(): Promise<L2連線資訊 | null> {
    try {
      const 系統資訊資料 = await this.取得系統資訊();
      if (!系統資訊資料 || !系統資訊資料.資料庫) {
        return null;
      }
      
      // 取得 SecretString 的明文內容
      let 資料庫連線字串: string = '';
      
      if (系統資訊資料.資料庫) {
        資料庫連線字串 = await 系統資訊資料.資料庫.getPlainText();
      }
      
      if (!資料庫連線字串 || 資料庫連線字串.trim() === '') {
        return null;
      }
      
      try {
        // 解析 JSON 格式的連線資訊
        const 連線資訊 = JSON.parse(資料庫連線字串) as L2連線資訊;
        return 連線資訊;
      } catch (解析錯誤) {
        await error('KV', `解析 L2 連線資訊 JSON 失敗: ${解析錯誤}`);
        return null;
      }
    } catch (錯誤) {
      await error('KV', `取得 L2 連線資訊失敗: ${錯誤}`);
      return null;
    }
  }

  // 設定 L2 連線資訊
  async 設定L2連線資訊(連線資訊: L2連線資訊): Promise<boolean> {
    try {
      // 將連線資訊轉換為 JSON 字串
      const 連線字串 = JSON.stringify(連線資訊);
      
      // 建立 SecretString 實例
      const 資料庫SecretString = new SecretString({ plainText: 連線字串 });
      
      // 更新系統資訊中的資料庫欄位
      const 更新成功 = await this.更新系統資訊({
        資料庫: 資料庫SecretString
      });
      
      if (更新成功) {
        await info('KV', 'L2 連線資訊設定成功');
        return true;
      } else {
        await error('KV', 'L2 連線資訊設定失敗');
        return false;
      }
    } catch (錯誤) {
      await error('KV', `設定 L2 連線資訊失敗: ${錯誤}`);
      return false;
    }
  }

  // 取得所有系統設定
  async 取得所有系統設定(): Promise<Record<string, any>> {
    try {
      const 設定: Record<string, any> = {};
      
      // 取得系統資訊
      const 系統資訊資料 = await this.取得系統資訊();
      if (系統資訊資料) {
        設定.系統資訊 = 系統資訊資料;
      }
      
      // 取得 L2 連線資訊
      const L2連線 = await this.取得L2連線資訊();
      if (L2連線) {
        設定.L2連線資訊 = L2連線;
      }
      
      return 設定;
    } catch (錯誤) {
      await error('KV', `取得系統設定失敗: ${錯誤}`);
      return {};
    }
  }

  // 關閉 KV 連線
  async 關閉(): Promise<void> {
    if (this.kvInstance) {
      this.kvInstance.close();
      this.kvInstance = null;
      this.已初始化 = false;
      await info('KV', 'KV 資料庫連線已關閉');
    }
  }
}

// 全域 KV 實例 (單例模式)
let kvDatabase: KV資料庫 | null = null;

// 取得全域 KV 資料庫實例
export function 取得KV資料庫(): KV資料庫 {
  if (!kvDatabase) {
    kvDatabase = new KV資料庫();
  }
  return kvDatabase;
}
