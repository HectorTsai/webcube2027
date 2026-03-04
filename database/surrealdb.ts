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

export class SurrealDB {
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

  /** 取得 token，如失敗丟出錯誤 */
  async signin(): Promise<void> {
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
    if (!resp.ok) throw new Error(`SurrealDB signin failed: ${resp.status}`);
    const body = await resp.json();
    this.token = body?.token as string | undefined ?? null;
    if (!this.token) throw new Error("未取得 SurrealDB token");
  }

  /** 執行 SQL 並回傳 JSON 結果 */
  async query(sql: string | string[]) {
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
      try {
        await this.signin();
        resp = await doQuery();
      } catch (_) {
        // re-signin 失敗，讓後續 throw
      }
    }

    if (!resp.ok) throw new Error(`SurrealDB query failed: ${resp.status}`);
    return resp.json();
  }

  async count(table: string): Promise<number> {
    try {
      const res = await this.query(`SELECT count() FROM ${table};`);
      const first = res?.[0];
      const val = first?.count ?? first?.count?.[0];
      return typeof val === "number" ? val : 0;
    } catch (_) {
      return 0;
    }
  }

  private async importSeed(table: string, seedFile: string) {
    const path = new URL(`./seeds/${seedFile}.json`, import.meta.url);
    const text = await Deno.readTextFile(path);
    const items = JSON.parse(text) as Record<string, unknown>[];
    for (const item of items) {
      try {
        await this.query(`CREATE ${table} CONTENT ${JSON.stringify(item)};`);
      } catch (_) {
        // swallow and continue importing others
      }
    }
  }

  /** 確認連線並在表為空時匯入種子 */
  async ensureSeed(): Promise<void> {
    try {
      await this.query("INFO FOR DB;");
    } catch (_) {
      return;
    }

    const tables: { name: string; file: string }[] = [
      { name: "佈景主題", file: "佈景主題" },
      { name: "配色", file: "配色" },
      { name: "骨架", file: "骨架" },
      { name: "單字", file: "單字" },
      { name: "圖示", file: "圖示" },
      { name: "語言", file: "語言" },
    ];

    for (const { name, file } of tables) {
      const count = await this.count(name);
      if (count === 0) {
        await this.importSeed(name, file);
      }
    }
  }
}
