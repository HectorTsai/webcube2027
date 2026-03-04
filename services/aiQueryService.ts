// AI 查詢白名單與驗證層
// 支援自然語言轉 SurrealDB 查詢，含安全性驗證與速率限制

import { SurrealDB } from "@/database/surrealdb.ts";

// 白名單：允許的表與欄位
const ALLOWED_TABLES = [
  "單字",
  "內容",
  "佈景主題",
  "配色",
  "骨架",
  "圖示",
  "標籤",
  "語言",
];

const ALLOWED_FIELDS: Record<string, string[]> = {
  單字: ["id", "資料", "更新時間", "建立時間"],
  內容: ["id", "標題", "內容", "標籤", "語言", "更新時間"],
  佈景主題: ["id", "名稱", "配色", "骨架", "更新時間"],
  配色: ["id", "主色", "次色", "強調色", "中性色", "背景1", "背景2", "背景3", "背景內容", "資訊色", "成功色", "警告色", "錯誤色"],
  骨架: ["id", "圓角", "間距"],
  圖示: ["id", "名稱", "路徑", "類型"],
  標籤: ["id", "名稱", "顏色"],
  語言: ["id", "代碼", "名稱"],
};

// 查詢限制
const MAX_QUERY_LENGTH = 1000;
const MAX_RESULTS = 100;
const QUERY_TIMEOUT_MS = 5000; // 5 秒

// 速率限制：每用戶每分鐘最多 10 查詢
const RATE_LIMIT_WINDOW_MS = 60000; // 1 分鐘
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

function validateQuery(sql: string): boolean {
  if (sql.length > MAX_QUERY_LENGTH) return false;

  // 簡易驗證：檢查是否包含禁止關鍵字
  const forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "EXEC", "SCRIPT"];
  if (forbidden.some(kw => sql.toUpperCase().includes(kw))) return false;

  // 檢查表與欄位（簡易解析）
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
  if (!selectMatch) return false;

  const fields = selectMatch[1].split(',').map(f => f.trim());
  const table = selectMatch[2];

  if (!ALLOWED_TABLES.includes(table)) return false;

  const allowedFields = ALLOWED_FIELDS[table] || [];
  for (const field of fields) {
    if (field === '*' || allowedFields.includes(field)) continue;
    return false;
  }

  return true;
}

export class AIQueryService {
  private db: SurrealDB;
  private ollamaUrl: string;

  constructor(db: SurrealDB, ollamaUrl = "http://localhost:11434") {
    this.db = db;
    this.ollamaUrl = ollamaUrl;
  }

  async query(naturalLanguage: string, userId: string, domain: string): Promise<any[]> {
    if (!checkRateLimit(userId)) {
      throw new Error("速率限制：請稍後再試");
    }

    const traceId = crypto.randomUUID();

    // 生成 SQL（模擬，使用 ollama）
    const sql = await this.generateSQL(naturalLanguage, domain);

    if (!validateQuery(sql)) {
      throw new Error("查詢不安全或不允許");
    }

    console.log(`[TRACE ${traceId}] User ${userId}: ${naturalLanguage} -> ${sql}`);

    // 執行查詢
    const result = await this.db.query(sql, { timeout: QUERY_TIMEOUT_MS });

    // 限制結果數量
    if (Array.isArray(result) && result.length > MAX_RESULTS) {
      result.splice(MAX_RESULTS);
    }

    return result;
  }

  private async generateSQL(prompt: string, domain: string): Promise<string> {
    // 使用 Ollama 生成 SQL
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama2", // 或其他模型
        prompt: `將以下自然語言轉為 SurrealDB SQL 查詢，只允許 SELECT，限制表與欄位在白名單中：\n${prompt}\n\n允許表：${ALLOWED_TABLES.join(', ')}\n\n輸出純 SQL：`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error("AI 生成失敗");
    }

    const data = await response.json();
    return data.response.trim();
  }
}
