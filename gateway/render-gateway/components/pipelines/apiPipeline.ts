// pipelines/apiPipeline.ts — 異步數據請求管線
// 職責：辨識 definition.mergedArgs 及 definition.args 中 default 值的 @api/ 或 @{服務名}/ 規格，
//       支援 {key} 變數動態插值，異步發送 InnerAPI 請求把生數據撈回來。
// 死鐵律：只負責把撈回來的生數據原封不動灌回 args，不准管數據內容或渲染。
import { InnerAPI } from "../../services/index.ts";
import { 智慧插值 } from "../../utils/安全過濾器.ts";
import type { Context } from "hono";
import { error } from "../../utils/logger.ts";

// ── API 安全防線 ──
const API_TIMEOUT_MS = 5_000;         // 5 秒超時熔斷（內部 API）
const MAX_RESPONSE_SIZE = 5_242_880;   // 5MB，拒絕異常大回應

// 🏎️ TextDecoder 全域單例（無狀態，避免每次請求重複 Instantiate）
const decoder = new TextDecoder();

/** Promise.race 超時包裝：內部 API 呼叫加上計時防線 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`API_TIMEOUT:${label}`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function 運行異步數據管線(
  definition: any,
  localArgs: Record<string, unknown>,
  context?: Context,
): Promise<Record<string, unknown>> {
  if (!context) return {};

  // 收集所有 @api/@media 規格（用 seenKeys 去重，防止 mergedArgs 與 args 重複推送同一 key）
  const apiTasks: [string, string][] = [];
  const seenKeys = new Set<string>();

  // 1. 掃描 definition.mergedArgs
  if (definition.mergedArgs) {
    const mergedArgsDef = definition.mergedArgs as Record<string, string>;
    for (const [key, spec] of Object.entries(mergedArgsDef)) {
      if (/^@\w+\//.test(spec) && !seenKeys.has(key)) {
        seenKeys.add(key);
        apiTasks.push([key, spec]);
      }
    }
  }

  // 2. 掃描 definition.args 中 default 值的 @api/@media 規格
  // 例如：svg.default = "@media/v1/icon/{id}"，當使用者傳入 id 時自動查詢
  // 判斷邏輯：直接檢查 argDef.default 是否為 @api 格式，而非依賴已被插值污染的 currentValue
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
      if (argDef.default && typeof argDef.default === "string" && /^@\w+\//.test(argDef.default)) {
        const currentValue = localArgs[key];
        // 使用的 API 模板：優先使用使用者傳入的 @api 模板，否則使用預設模板
        const specToUse = typeof currentValue === "string" && /^@\w+\//.test(currentValue) 
          ? currentValue 
          : argDef.default;
        // 只有當使用者未覆蓋，或覆蓋的值也是 @api 模板時，才執行 API 請求
        const shouldFetch = currentValue === undefined || 
          (typeof currentValue === "string" && /^@\w+\//.test(currentValue));
        if (shouldFetch && !seenKeys.has(key)) {
          seenKeys.add(key);
          apiTasks.push([key, specToUse]);
        }
      }
    }
  }

  if (apiTasks.length === 0) return {};

  const resolved: Record<string, unknown> = {};
  const results = await Promise.all(
    apiTasks.map(async ([key, spec]) => {
      try {
        const interpolated = String(智慧插值(spec, localArgs) ?? spec).replace(/^@(\w+)\//, "/$1/");
        const response = await withTimeout(InnerAPI(context, interpolated), API_TIMEOUT_MS, interpolated);

        // 🔴 回應大小防線：Content-Length 快速熔斷（標頭宣稱超大 → 直接拒絕）
        const contentLength = response.headers.get("Content-Length");
        if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
          await error("API", `回應過大 (${contentLength} bytes)，已熔斷: ${interpolated}`);
          return { key, value: undefined };
        }

        const contentType = response.headers.get("Content-Type") || "";
        const isJson = contentType.includes("json");

        // 🛡️ 一律強制串流讀取（杜絕 Content-Length 標頭欺騙）
        //    不論有無 Content-Length 標頭，都走 ReadableStream 累計大小讀取，
        //    確保 upstream 惡意灌入遠大於標頭宣告的資料時，仍能即時熔斷不 OOM。
        if (!response.body) {
          // 極少數無 body 的響應（如 204 No Content）→ 安全 fallback
          return { key, value: undefined };
        }

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let totalSize = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalSize += value.byteLength;
            if (totalSize > MAX_RESPONSE_SIZE) {
              await reader.cancel();
              await error("API", `串流回應超過上限 ${MAX_RESPONSE_SIZE} bytes，已熔斷: ${interpolated}`);
              return { key, value: undefined };
            }
            chunks.push(value);
          }
        } finally {
          // 🛡️ 優先 cancel() 釋放底層 Socket 資源，避免連線洩漏
          //    releaseLock() 僅釋放 JS 層鎖，不保證關閉底層串流
          try { await reader.cancel(); } catch { /* 串流已終止 */ }
          try { reader.releaseLock(); } catch { /* 已釋放 */ }
        }

        // 拼裝完整回應
        const total = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) { total.set(chunk, offset); offset += chunk.byteLength; }
        const raw = decoder.decode(total);

        if (isJson) {
          try {
            const parsed = JSON.parse(raw);
            // 🔵 容錯：支援系統自定義 { success, data } 包裝格式，
            //    也直接相容標準第三方 API（如純陣列、純物件），無 success 欄位時原值穿透
            return { key, value: parsed.success !== undefined ? (parsed.success ? parsed.data : undefined) : parsed };
          } catch {
            return { key, value: undefined };
          }
        }
        return { key, value: raw };
      } catch (err: unknown) {
        if (err instanceof Error && err.message.startsWith("API_TIMEOUT:")) {
          await error("API", `請求超時 (${API_TIMEOUT_MS}ms): ${spec}`);
        }
        return { key, value: undefined };
      }
    }),
  );
  for (const { key, value } of results) resolved[key] = value;
  return resolved;
}
