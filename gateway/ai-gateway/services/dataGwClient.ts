/**
 * dataGwClient — data-gateway REST API 統一客戶端
 *
 * 所有 ai-gateway 對資料的存取都透過此模組，
 * 取代原本直接使用 @dui/database dataPool 的方式。
 */

const DATA_GW = Deno.env.get('DATA_GATEWAY_URL');

// ────────────────────────────────────────────────────
//  響應型別（data-gateway API 回傳格式）
// ────────────────────────────────────────────────────
interface GwResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ────────────────────────────────────────────────────
//  公開 API
// ────────────────────────────────────────────────────

/** 依 collection + model 列表 */
export async function list<T>(
  collection: string,
  model?: string,
  options?: { limit?: number; offset?: number },
): Promise<T[]> {
  let path = `/api/${collection}`;
  if (model) path += `/${model}`;
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  const qs = params.toString();
  const url = `${DATA_GW}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`dataGw.list(${path}): ${res.status}`);
  const json: GwResponse<T[]> = await res.json();
  if (!json.success) throw new Error(`dataGw.list(${path}): ${json.error}`);
  return json.data;
}

/** 依複合 ID 取得單筆 */
export async function get<T>(id: string): Promise<T | null> {
  const res = await fetch(`${DATA_GW}/api/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`dataGw.get(${id}): ${res.status}`);
  const json: GwResponse<T> = await res.json();
  if (!json.success) return null;
  return json.data;
}

/** 新增 */
export async function create<T>(
  collection: string,
  model: string,
  body: Partial<T>,
): Promise<T> {
  const res = await fetch(`${DATA_GW}/api/${collection}/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`dataGw.create(${collection}/${model}): ${res.status}`);
  const json: GwResponse<T> = await res.json();
  if (!json.success) throw new Error(`dataGw.create(${collection}/${model}): ${json.error}`);
  return json.data;
}

/** 更新（依複合 ID） */
export async function update<T>(id: string, body: Partial<T>): Promise<T> {
  const res = await fetch(`${DATA_GW}/api/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`dataGw.update(${id}): ${res.status}`);
  const json: GwResponse<T> = await res.json();
  if (!json.success) throw new Error(`dataGw.update(${id}): ${json.error}`);
  return json.data;
}

/** 刪除 */
export async function del(id: string): Promise<void> {
  const res = await fetch(`${DATA_GW}/api/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`dataGw.del(${id}): ${res.status}`);
  const json: GwResponse<void> = await res.json();
  if (!json.success) throw new Error(`dataGw.del(${id}): ${json.error}`);
}

/** 健康檢查 */
export async function health(): Promise<{ status: string; l1: string; l2: string }> {
  const res = await fetch(`${DATA_GW}/health`);
  if (!res.ok) throw new Error(`dataGw.health(): ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}