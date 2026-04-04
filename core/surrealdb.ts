interface SurrealConfig {
  url: string;
  database: string;
  namespace: string;
  user: string;
  password: string;
}

interface QueryHeaders {
  Authorization: string;
  NS: string;
  DB: string;
  "Content-Type": string;
}

export default class Surreal資料庫 {
  private config: SurrealConfig;
  private token: string | null = null;

  constructor(config: SurrealConfig) {
    this.config = config;
  }

  private buildHeaders(): QueryHeaders {
    if (!this.token) throw new Error("尚未登入 SurrealDB");
    return {
      Authorization: `Bearer ${this.token}`,
      NS: this.config.namespace,
      DB: this.config.database,
      "Content-Type": "text/plain",
    };
  }

  /** 取得 token，如失敗log並傳false */
  async 登入(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.config.url}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: this.config.namespace,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
        }),
      });
      if (!resp.ok) {
        console.error(`[surrealdb.ts] SurrealDB signin failed: ${resp.status}`);
        return false;
      }
      const body = await resp.json();
      this.token = body?.token as string | undefined ?? null;
      if (!this.token) {
        console.error("[surrealdb.ts] 未取得 SurrealDB token");
        return false;
      }
      return true;
    } catch (error) {
      console.error("SurrealDB signin exception:", error);
      return false;
    }
  }

  /** 執行 SQL 並回傳 JSON 結果 */
  async 查詢(sql: string | string[]) {
    try {
      const stmt = Array.isArray(sql) ? sql.join("\n") : sql;
      const doQuery = () =>
        fetch(`${this.config.url}/sql`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: stmt,
        });

      let resp = await doQuery();

      // 若因授權失效（401/403）則重新登入後重試一次
      if (!resp.ok && (resp.status === 401 || resp.status === 403)) {
        if (await this.登入()) {
          resp = await doQuery();
        } else {
          console.error("[surrealdb.ts] 重新登入失敗");
          return [];
        }
      }

      if (!resp.ok) {
        console.error(`[surrealdb.ts] SurrealDB query failed: ${resp.status}`);
        return [];
      }
      return resp.json();
    } catch (error) {
      console.error("[surrealdb.ts] SurrealDB query exception:", error);
      return [];
    }
  }

  async 個數(table: string): Promise<number> {
    try {
      const res = await this.查詢(`SELECT count() FROM ${table};`);
      const first = res?.[0];
      const val = first?.count ?? first?.count?.[0];
      return typeof val === "number" ? val : 0;
    } catch (_) {
      return 0;
    }
  }

  /** 確認連線並在表為空時匯入種子 */
  async 初始化(model: string): Promise<void> {
    try {
      await this.查詢("INFO FOR DB;");
    } catch (_) {
      return;
    }

    if (await this.個數(model) === 0) {
      // 使用統一的讀取種子函數
      const { 讀取種子 } = await import('../database/index.ts');
      const items = await 讀取種子(model);
      
      if (!items) {
        console.error(`[surrealdb.ts] ${model} 種子資料不存在`);
        return;
      }
      
      // 將已實體化的模型直接存入資料庫
      for (const 模型實例 of items) {
        try {
          await 模型實例.初始化();
          await this.查詢(`CREATE ${model} CONTENT ${JSON.stringify(模型實例.toJSON())};`);
        } catch (錯誤) {
          console.error(`[surrealdb.ts] 儲存 ${model} 模型實例失敗: ${錯誤}`);
        }
      }
    }
  }
}
