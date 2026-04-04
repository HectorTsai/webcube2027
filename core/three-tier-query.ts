// 三層查詢架構核心邏輯
import { Context } from 'hono';
import { 資料 } from '../database/index.ts';
import { info, error } from '../utils/logger.ts';

// 三層查詢結果類型
export interface 查詢結果<T> {
  data: T | null;
  source: 'L1' | 'L2' | 'L3';
  success: boolean;
  error?: string;
}

// 三層查詢管理器
export class 三層查詢管理器 {
  
  // 根據 ID 查詢單一資料
  static async 查詢單一<T extends 資料>(
    c: Context, 
    id: string
  ): Promise<查詢結果<T>> {
    const kvDB = c.get('kvDB');
    const l2DB = c.get('l2DB');
    const l3DB = c.get('l3DB');
    const tenant = c.get('tenant');
    
    // 從 ID 解析出 model：table:model:uuid
    const idParts = id.split(':');
    if (idParts.length < 3) {
      await error('三層查詢', `ID 格式錯誤: ${id}，應為 table:model:uuid 格式`);
      return { data: null, source: 'L1', success: false, error: 'ID 格式錯誤' };
    }
    
    const model = idParts[1]; // model 名稱在第二個位置
    
    try {
      // L3: 租戶資料庫查詢
      if (l3DB) {
        try {
          const l3結果 = await l3DB.查詢(`SELECT * FROM ${model} WHERE id = '${id}' LIMIT 1;`);
          
          if (l3結果 && l3結果[0] && l3結果[0].result && l3結果[0].result.length > 0) {
            const 資料 = await 三層查詢管理器.轉換為模型實例<T>(l3結果[0].result[0]);
            if (資料) {
              // await info('三層查詢', `L3 查詢成功: ${model}:${id} (tenant: ${tenant})`);
              return { data: 資料, source: 'L3', success: true };
            }
          }
        } catch (l3錯誤) {
          await error('三層查詢', `L3 查詢失敗: ${l3錯誤}`);
        }
      }
      
      // L2: 系統資料庫查詢
      if (l2DB) {
        try {
          const l2結果 = await l2DB.查詢(`SELECT * FROM ${model} WHERE id = '${id}' LIMIT 1;`);
          
          if (l2結果 && l2結果[0] && l2結果[0].result && l2結果[0].result.length > 0) {
            const 資料 = await 三層查詢管理器.轉換為模型實例<T>(l2結果[0].result[0]);
            if (資料) {
              // await info('三層查詢', `L2 查詢成功: ${model}:${id}`);
              return { data: 資料, source: 'L2', success: true };
            }
          }
        } catch (l2錯誤) {
          await error('三層查詢', `L2 查詢失敗: ${l2錯誤}`);
        }
      }
      
      // L1: KV 資料庫查詢
      try {
        const l1資料 = await kvDB.取得(id);
        if (l1資料) {
          // await info('三層查詢', `L1 查詢成功: ${model}:${id}`);
          return { data: l1資料 as T, source: 'L1', success: true };
        }
      } catch (l1錯誤) {
        await error('三層查詢', `L1 查詢失敗: ${l1錯誤}`);
      }
      
      // 所有層級都失敗，返回空結果
      return { data: null, source: 'L1', success: false, error: '所有資料庫層級都無此資料' };
      
    } catch (錯誤) {
      await error('三層查詢', `查詢過程發生錯誤: ${錯誤}`);
      return { data: null, source: 'L1', success: false, error: (錯誤 as Error).toString() };
    }
  }
  
  // 查詢模型列表
  static async 查詢列表<T extends 資料>(
    c: Context,
    model: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<查詢結果<T[]>> {
    const kvDB = c.get('kvDB');
    const l2DB = c.get('l2DB');
    const l3DB = c.get('l3DB');
    const tenant = c.get('tenant');
    
    try {
      let 合併結果: T[] = [];
      let 主要來源: 'L1' | 'L2' | 'L3' = 'L1';
      
      // L3: 租戶資料庫查詢
      if (l3DB) {
        try {
          const l3結果 = await l3DB.查詢(
            `SELECT * FROM ${model} ORDER BY 最後修改 DESC LIMIT ${limit} START ${offset};`
          );
          
          if (l3結果 && l3結果[0] && l3結果[0].result) {
            for (const 原始資料 of l3結果[0].result) {
              const 模型實例 = await 三層查詢管理器.轉換為模型實例<T>(model, 原始資料);
              if (模型實例) {
                合併結果.push(模型實例);
              }
            }
            主要來源 = 'L3';
            // await info('三層查詢', `L3 列表查詢成功: ${model} (${合併結果.length} 筆, tenant: ${tenant})`);
          }
        } catch (l3錯誤) {
          await error('三層查詢', `L3 列表查詢失敗: ${l3錯誤}`);
        }
      }
      
      // L2: 系統資料庫查詢（如果 L3 沒有結果）
      if (合併結果.length === 0 && l2DB) {
        try {
          const l2結果 = await l2DB.查詢(
            `SELECT * FROM ${model} ORDER BY 最後修改 DESC LIMIT ${limit} START ${offset};`
          );
          
          if (l2結果 && l2結果[0] && l2結果[0].result) {
            for (const 原始資料 of l2結果[0].result) {
              const 模型實例 = await 三層查詢管理器.轉換為模型實例<T>(model, 原始資料);
              if (模型實例) {
                合併結果.push(模型實例);
              }
            }
            主要來源 = 'L2';
            // await info('三層查詢', `L2 列表查詢成功: ${model} (${合併結果.length} 筆)`);
          }
        } catch (l2錯誤) {
          await error('三層查詢', `L2 列表查詢失敗: ${l2錯誤}`);
        }
      }
      
      // L1: KV 資料庫查詢（如果前兩層都沒有結果）
      if (合併結果.length === 0) {
        try {
          // 從 KV 取得所有該模型的資料
          const kv = await kvDB.取得KV();
          const l1資料: T[] = [];
          
          for await (const entry of kv.list({ prefix: [model] })) {
            if (entry.value && entry.key.length >= 2) {
              const id = entry.key[1] as string;
              const 實例 = await kvDB.取得(id);
              if (實例) {
                l1資料.push(實例 as T);
              }
            }
          }
          
          // 排序並分頁
          l1資料.sort((a, b) => b.最後修改.getTime() - a.最後修改.getTime());
          合併結果 = l1資料.slice(offset, offset + limit);
          
          // await info('三層查詢', `L1 列表查詢成功: ${model} (${合併結果.length} 筆)`);
        } catch (l1錯誤) {
          await error('三層查詢', `L1 列表查詢失敗: ${l1錯誤}`);
        }
      }
      
      return { data: 合併結果, source: 主要來源, success: true };
      
    } catch (錯誤) {
      await error('三層查詢', `列表查詢過程發生錯誤: ${錯誤}`);
      return { data: [], source: 'L1', success: false, error: (錯誤 as Error).toString() };
    }
  }
  
  // 取得預設值（L1 fallback）
  static async 取得預設值<T extends 資料>(
    c: Context,
    model: string
  ): Promise<查詢結果<T>> {
    const kvDB = c.get('kvDB');
    
    try {
      const 預設資料 = await kvDB.取得一個(model);
      
      if (預設資料) {
        // await info('三層查詢', `取得預設值成功: ${model}`);
        return { data: 預設資料 as T, source: 'L1', success: true };
      } else {
        return { data: null, source: 'L1', success: false, error: '查詢過程發生錯誤' };
      }
    } catch (錯誤) {
      await error('三層查詢', `取得預設值失敗: ${錯誤}`);
      return { data: null, source: 'L1', success: false, error: (錯誤 as Error).toString() };
    }
  }
  
  // 將原始資料轉換為模型實例
  private static async 轉換為模型實例<T extends 資料>(
    modelOrData: string | Record<string, unknown>,
    原始資料?: Record<string, unknown>
  ): Promise<T | null> {
    try {
      // 判斷第一個參數是 model 還是資料
      let model: string;
      let data: Record<string, unknown>;
      
      if (typeof modelOrData === 'string') {
        // 舊格式：轉換為模型實例(model, 原始資料)
        model = modelOrData;
        data = 原始資料!;
      } else {
        // 新格式：轉換為模型實例(原始資料)，從 ID 解析 model
        data = modelOrData;
        const id = data.id as string;
        
        if (!id) {
          await error('三層查詢', `資料缺少 ID 欄位，無法解析 model`);
          return null;
        }
        
        // 從 ID 解析出 model：table:model:uuid
        const idParts = id.split(':');
        if (idParts.length < 3) {
          await error('三層查詢', `ID 格式錯誤: ${id}，應為 table:model:uuid 格式`);
          return null;
        }
        
        model = idParts[1]; // model 名稱在第二個位置
      }
      
      // 動態導入模型類別
      const 模型模組 = await import(`../database/models/${model}.ts`);
      const 模型類別 = 模型模組.default;
      
      if (!模型類別 || typeof 模型類別 !== 'function') {
        await error('三層查詢', `無法導入模型類別: ${model}`);
        return null;
      }
      
      // 建立模型實例
      const 實例 = new 模型類別(data, data.可刪除 || false);
      return 實例 as T;
      
    } catch (錯誤) {
      await error('三層查詢', `轉換模型實例失敗: ${錯誤}`);
      return null;
    }
  }
  
  // 創建或更新資料（優先寫入最高層級可用的資料庫）
  static async 創建或更新<T extends 資料>(
    c: Context,
    model: string,
    資料: Partial<T>
  ): Promise<查詢結果<T>> {
    const l3DB = c.get('l3DB');
    const l2DB = c.get('l2DB');
    const tenant = c.get('tenant');
    
    // 智能處理 ID
    let id: string;
    let isUpdate: boolean;
    
    if (!資料.id) {
      // 沒有 ID，創建新的完整 ID
      const { nanoid } = await import('nanoid');
      const uuid = nanoid();
      id = `${model}:${model}:${uuid}`;
      isUpdate = false;
    } else {
      const idParts = (資料.id as string).split(':');
      
      if (idParts.length === 3) {
        // 完整的三段 ID: table:model:uuid -> 更新
        id = 資料.id as string;
        isUpdate = true;
      } else if (idParts.length === 2) {
        // 兩段 ID: table:model -> 補上 uuid
        const { nanoid } = await import('nanoid');
        const uuid = nanoid();
        id = `${idParts[0]}:${idParts[1]}:${uuid}`;
        isUpdate = false;
      } else if (idParts.length === 1) {
        // 一段 ID: table -> 補上 table:table:uuid
        const { nanoid } = await import('nanoid');
        const uuid = nanoid();
        id = `${idParts[0]}:${idParts[0]}:${uuid}`;
        isUpdate = false;
      } else {
        // 其他情況，視為無效格式
        await error('三層查詢', `ID 格式錯誤: ${資料.id}，應為 table:model:uuid 格式`);
        return { data: null, source: 'L1', success: false, error: 'ID 格式錯誤' };
      }
    }
    
    // 更新資料中的 ID
    const 更新資料 = { ...資料, id };
    
    try {
      // 優先使用 L3（租戶資料庫）
      if (l3DB) {
        try {
          const sql = isUpdate 
            ? `UPDATE ${model} SET ${三層查詢管理器.建構更新SQL(更新資料)} WHERE id = '${id}';`
            : `CREATE ${model} CONTENT ${JSON.stringify(更新資料)};`;
          
          const 結果 = await l3DB.查詢(sql);
          
          if (結果 && 結果[0] && 結果[0].result) {
            const 更新後資料 = 結果[0].result[0];
            const 模型實例 = await 三層查詢管理器.轉換為模型實例<T>(更新後資料);
            
            if (模型實例) {
              // await info('三層查詢', `L3 ${isUpdate ? '更新' : '創建'}成功: ${model} (tenant: ${tenant})`);
              return { data: 模型實例, source: 'L3', success: true };
            }
          }
        } catch (l3錯誤) {
          await error('三層查詢', `L3 ${isUpdate ? '更新' : '創建'}失敗: ${l3錯誤}`);
        }
      }
      
      // 降級到 L2（系統資料庫）
      if (l2DB) {
        try {
          const sql = isUpdate 
            ? `UPDATE ${model} SET ${三層查詢管理器.建構更新SQL(更新資料)} WHERE id = '${id}';`
            : `CREATE ${model} CONTENT ${JSON.stringify(更新資料)};`;
          
          const 結果 = await l2DB.查詢(sql);
          
          if (結果 && 結果[0] && 結果[0].result) {
            const 更新後資料 = 結果[0].result[0];
            const 模型實例 = await 三層查詢管理器.轉換為模型實例<T>(更新後資料);
            
            if (模型實例) {
              // await info('三層查詢', `L2 ${isUpdate ? '更新' : '創建'}成功: ${model}`);
              return { data: 模型實例, source: 'L2', success: true };
            }
          }
        } catch (l2錯誤) {
          await error('三層查詢', `L2 ${isUpdate ? '更新' : '創建'}失敗: ${l2錯誤}`);
        }
      }
      
      return { data: null, source: 'L1', success: false, error: '無可用的寫入資料庫' };
      
    } catch (錯誤) {
      await error('三層查詢', `${isUpdate ? '更新' : '創建'}過程發生錯誤: ${錯誤}`);
      return { data: null, source: 'L1', success: false, error: (錯誤 as Error).toString() };
    }
  }
  
  // 刪除資料（檢查可刪除欄位）
  static async 刪除(
    c: Context,
    id: string
  ): Promise<查詢結果<boolean>> {
    try {
      // 先查詢資料是否存在且可刪除
      const 查詢結果 = await 三層查詢管理器.查詢單一(c, id);
      
      if (!查詢結果.success || !查詢結果.data) {
        return { data: false, source: 'L1', success: false, error: '資料不存在' };
      }
      
      if (!查詢結果.data.可刪除) {
        return { data: false, source: 'L1', success: false, error: 'DELETE_PROTECTED' };
      }
      
      // 從 ID 解析出 model
      const idParts = id.split(':');
      const model = idParts[1]; // model 名稱在第二個位置
      
      // 根據資料來源決定刪除位置
      const l3DB = c.get('l3DB');
      const l2DB = c.get('l2DB');
      
      if (查詢結果.source === 'L3' && l3DB) {
        try {
          await l3DB.查詢(`DELETE FROM ${model} WHERE id = '${id}';`);
          // await info('三層查詢', `L3 刪除成功: ${model}:${id}`);
          return { data: true, source: 'L3', success: true };
        } catch (錯誤) {
          await error('三層查詢', `L3 刪除失敗: ${錯誤}`);
        }
      }
      
      if (查詢結果.source === 'L2' && l2DB) {
        try {
          await l2DB.查詢(`DELETE FROM ${model} WHERE id = '${id}';`);
          // await info('三層查詢', `L2 刪除成功: ${model}:${id}`);
          return { data: true, source: 'L2', success: true };
        } catch (錯誤) {
          await error('三層查詢', `L2 刪除失敗: ${錯誤}`);
        }
      }
      
      return { data: false, source: 'L1', success: false, error: 'L1 資料無法刪除' };
      
    } catch (錯誤) {
      await error('三層查詢', `刪除過程發生錯誤: ${錯誤}`);
      return { data: false, source: 'L1', success: false, error: (錯誤 as Error).toString() };
    }
  }
  
  // 建構更新 SQL
  private static 建構更新SQL(資料: Record<string, unknown>): string {
    const 更新欄位 = Object.entries(資料)
      .filter(([_key, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
      .join(', ');
    
    return 更新欄位;
  }
}
