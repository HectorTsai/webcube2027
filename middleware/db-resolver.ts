// 三層資料庫解析器 - 根據 host 選擇正確的 DB 連線
import { Context, Next } from 'hono';
import { 取得KV資料庫 } from '../core/kv.ts';
import { L2連線資訊 } from '../database/index.ts';
import Surreal資料庫 from '../core/surrealdb.ts';
import { info, error } from '../utils/logger.ts';

// 擴展 Hono Context 類型，加入資料庫實例
declare module 'hono' {
  interface ContextVariableMap {
    kvDB: ReturnType<typeof 取得KV資料庫>;
    l2DB: Surreal資料庫 | null;
    l3DB: Surreal資料庫 | null;
    host: string;
    tenant: string;
  }
}

// L3 連線池 - 管理多個租戶資料庫連線
class L3連線池 {
  private static instance: L3連線池;
  private 連線池 = new Map<string, Surreal資料庫>();
  private 連線中 = new Set<string>();
  
  static getInstance(): L3連線池 {
    if (!L3連線池.instance) {
      L3連線池.instance = new L3連線池();
    }
    return L3連線池.instance;
  }
  
  // 根據租戶取得或建立 L3 連線
  async 取得L3連線(tenant: string, l2DB: Surreal資料庫): Promise<Surreal資料庫 | null> {
    try {
      // 檢查是否已有連線
      if (this.連線池.has(tenant)) {
        return this.連線池.get(tenant)!;
      }
      
      // 避免重複連線
      if (this.連線中.has(tenant)) {
        // 等待其他連線完成
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.連線池.get(tenant) || null;
      }
      
      this.連線中.add(tenant);
      
      // 從 L2 查詢租戶的資料庫連線資訊
      const 租戶資訊 = await this.查詢租戶資訊(tenant, l2DB);
      
      if (!租戶資訊) {
        await info('DB-Resolver', `租戶 ${tenant} 無 L3 資料庫配置`);
        this.連線中.delete(tenant);
        return null;
      }
      
      // 建立 L3 連線
      const l3DB = new Surreal資料庫({
        url: `http://${租戶資訊.主機}:${租戶資訊.埠號}`,
        database: 租戶資訊.資料庫名稱,
        namespace: 租戶資訊.命名空間,
        user: 租戶資訊.使用者名稱,
        password: 租戶資訊.密碼
      });
      
      // 嘗試登入
      const 登入成功 = await l3DB.登入();
      
      if (登入成功) {
        this.連線池.set(tenant, l3DB);
        await info('DB-Resolver', `租戶 ${tenant} L3 連線建立成功`);
      } else {
        await error('DB-Resolver', `租戶 ${tenant} L3 連線失敗`);
      }
      
      this.連線中.delete(tenant);
      return 登入成功 ? l3DB : null;
      
    } catch (錯誤) {
      this.連線中.delete(tenant);
      await error('DB-Resolver', `取得 L3 連線失敗: ${錯誤}`);
      return null;
    }
  }
  
  // 從 L2 查詢租戶資訊
  private async 查詢租戶資訊(tenant: string, l2DB: Surreal資料庫): Promise<L2連線資訊 | null> {
    try {
      // 查詢租戶的資料庫配置
      const 結果 = await l2DB.查詢(`SELECT * FROM 網站資訊 WHERE 網域 = '${tenant}' LIMIT 1;`);
      
      if (!結果 || !結果[0] || !結果[0].result || !結果[0].result[0]) {
        return null;
      }
      
      const 租戶資料 = 結果[0].result[0];
      
      // 解析資料庫連線資訊
      if (租戶資料.資料庫連線) {
        return JSON.parse(租戶資料.資料庫連線) as L2連線資訊;
      }
      
      return null;
    } catch (錯誤) {
      await error('DB-Resolver', `查詢租戶資訊失敗: ${錯誤}`);
      return null;
    }
  }
  
  // 關閉指定租戶的連線
  async 關閉連線(tenant: string): Promise<void> {
    const 連線 = this.連線池.get(tenant);
    if (連線) {
      this.連線池.delete(tenant);
      await info('DB-Resolver', `租戶 ${tenant} L3 連線已關閉`);
    }
  }
  
  // 關閉所有連線
  async 關閉所有連線(): Promise<void> {
    const 租戶列表 = Array.from(this.連線池.keys());
    for (const tenant of 租戶列表) {
      await this.關閉連線(tenant);
    }
  }
}

// L2 系統資料庫連線（單例）
class L2系統資料庫 {
  private static instance: Surreal資料庫 | null = null;
  private static 初始化中 = false;
  
  static async 取得實例(): Promise<Surreal資料庫 | null> {
    if (L2系統資料庫.instance) {
      return L2系統資料庫.instance;
    }
    
    if (L2系統資料庫.初始化中) {
      // 等待初始化完成
      while (L2系統資料庫.初始化中) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return L2系統資料庫.instance;
    }
    
    L2系統資料庫.初始化中 = true;
    
    try {
      // 從 KV 取得 L2 連線資訊
      const kvDB = 取得KV資料庫();
      const l2連線資訊 = await kvDB.取得L2連線資訊();
      
      if (!l2連線資訊) {
        await info('DB-Resolver', 'L2 連線資訊不存在，跳過 L2 初始化');
        L2系統資料庫.初始化中 = false;
        return null;
      }
      
      // 建立 L2 連線
      const l2DB = new Surreal資料庫({
        url: `http://${l2連線資訊.主機}:${l2連線資訊.埠號}`,
        database: l2連線資訊.資料庫名稱,
        namespace: l2連線資訊.命名空間,
        user: l2連線資訊.使用者名稱,
        password: l2連線資訊.密碼
      });
      
      // 嘗試登入
      const 登入成功 = await l2DB.登入();
      
      if (登入成功) {
        L2系統資料庫.instance = l2DB;
        await info('DB-Resolver', 'L2 系統資料庫連線成功');
      } else {
        await error('DB-Resolver', 'L2 系統資料庫登入失敗');
      }
      
    } catch (錯誤) {
      await error('DB-Resolver', `L2 系統資料庫初始化失敗: ${錯誤}`);
    }
    
    L2系統資料庫.初始化中 = false;
    return L2系統資料庫.instance;
  }
}

// 從 host 解析租戶名稱
function 解析租戶名稱(host: string): string {
  // 移除 port 和協議
  const cleanHost = host.replace(/^https?:\/\//, '').split(':')[0];
  
  // 如果是 localhost 或 IP，使用 'default'
  if (cleanHost === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
    return 'default';
  }
  
  // 使用完整域名作為租戶名稱
  return cleanHost;
}

// 資料庫解析器中間件
export async function 資料庫解析器(c: Context, next: Next) {
  try {
    // 取得 host 資訊
    const host = c.req.header('host') || 'localhost';
    const tenant = 解析租戶名稱(host);
    
    await info('DB-Resolver', `處理請求: host=${host}, tenant=${tenant}`);
    
    // 設定基本資訊
    c.set('host', host);
    c.set('tenant', tenant);
    
    // L1: KV 資料庫（總是可用）
    const kvDB = 取得KV資料庫();
    c.set('kvDB', kvDB);
    
    // L2: 系統資料庫（單例，可能不存在）
    const l2DB = await L2系統資料庫.取得實例();
    c.set('l2DB', l2DB);
    
    // L3: 租戶資料庫（根據 host 動態連線，可能不存在）
    let l3DB: Surreal資料庫 | null = null;
    
    if (l2DB) {
      const 連線池 = L3連線池.getInstance();
      l3DB = await 連線池.取得L3連線(tenant, l2DB);
    }
    
    c.set('l3DB', l3DB);
    
    // 記錄可用的資料庫層級
    const 可用層級 = [
      'L1(KV)',
      l2DB ? 'L2(System)' : null,
      l3DB ? 'L3(Tenant)' : null
    ].filter(Boolean);
    
    await info('DB-Resolver', `可用資料庫層級: ${可用層級.join(', ')}`);
    
    // 繼續處理請求
    await next();
    
  } catch (錯誤) {
    await error('DB-Resolver', `資料庫解析器錯誤: ${錯誤}`);
    
    // 設定最小可用配置（至少有 L1）
    c.set('kvDB', 取得KV資料庫());
    c.set('l2DB', null);
    c.set('l3DB', null);
    c.set('host', c.req.header('host') || 'localhost');
    c.set('tenant', 'default');
    
    await next();
  }
}

// 清理資源（用於應用程式關閉時）
export async function 清理資料庫連線() {
  const 連線池 = L3連線池.getInstance();
  await 連線池.關閉所有連線();
  await info('DB-Resolver', '所有資料庫連線已清理');
}
