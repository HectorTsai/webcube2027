// Firestore (Google Firebase) Adapter — 使用 firebase-admin 實作 DatabaseAdapter
// 每個 collection = 一個 Firestore collection，文件內以 data map 儲存完整記錄
//
// 連線資訊一律從 L2連線資訊 / L3連線資訊 的設定欄位傳入，不使用環境變數：
//   - projectId  ← L2連線資訊.主機 或 .資料庫名稱
//   - credential ← L2連線資訊.密碼（service account JSON 字串）
//   - databaseId ← L2連線資訊.命名空間（選用）

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Timestamp } from 'firebase-admin/firestore';
import { sanitizePayload, isSafeIdentifier, type DatabaseAdapter, type QueryOptions, type FieldFilter } from './adapter-interface.ts';
import { info, error as logError } from '@dui/util';

export interface FirestoreConnectOptions {
  /** Firebase 專案 ID（必要）*/
  projectId: string;
  /** 服務帳戶 JSON 內容（與環境變數 GOOGLE_APPLICATION_CREDENTIALS 擇一）*/
  credential?: Record<string, unknown>;
  /** Firestore 資料庫 ID（選用，預設為 "(default)"）*/
  databaseId?: string;
}

export class FirestoreAdapter implements DatabaseAdapter {
  readonly type = 'firestore';
  private db!: Firestore;
  private 選項: FirestoreConnectOptions;

  constructor(選項: FirestoreConnectOptions) {
    this.選項 = 選項;
  }

  async connect(): Promise<void> {
    if (this.db) return;

    const appName = `dui-database-${this.選項.projectId}`;
    let app: App | undefined = getApps().find((a: App) => a.name === appName);

    if (!app) {
      if (!this.選項.credential) {
        throw new Error(
          'Firestore 連線需要提供 credential（服務帳戶 JSON）\n' +
          '請在 L2連線資訊.密碼 欄位放入 service account JSON 字串'
        );
      }
      app = initializeApp({
        projectId: this.選項.projectId,
        credential: cert(this.選項.credential),
      }, appName);
    }

    this.db = this.選項.databaseId
      ? getFirestore(app, this.選項.databaseId)
      : getFirestore(app);
  }

  private 拿到DB(): Firestore {
    if (!this.db) throw new Error('Firestore Adapter 尚未初始化，請先呼叫 connect()');
    return this.db;
  }

  /** 將 Firestore 文件快照的 data map 取出 */
  private 快照取資料(snap: { exists: boolean; data: () => Record<string, unknown> | undefined }): Record<string, unknown> | null {
    if (!snap.exists) return null;
    const raw = snap.data();
    const 資料 = (raw?.data ?? raw) as Record<string, unknown> | undefined;
    return 資料 ? this.序列化Timestamp(資料) : null;
  }

  /** 將 Firestore Timestamp 轉為 ISO 字串 */
  private 序列化Timestamp(raw: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value && typeof value === 'object' && 'toDate' in value) {
        result[key] = (value as Timestamp).toDate().toISOString();
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const collection = id.split(':')[0];
    try {
      const db = this.拿到DB();
      const doc = await db.collection(collection).doc(id).get();
      return this.快照取資料(doc);
    } catch (err) {
      await logError('FirestoreAdapter', `getById 失敗 (${id}): ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  /**
   * 列出 collection 的記錄（支援 modelType 前綴篩選、分頁與排序）。
   *
   * @note Firestore 的 offset() 會按讀取筆數計費，巨量分頁時效能與費用開銷高，
   *       建議改用 cursor 分頁（startAfter/startAt）進行逐頁導覽。
   */
  async list(collection: string, modelType?: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    const offsetNum = options?.offset ?? 0;
    const filter = options?.filter;
    try {
      const db = this.拿到DB();
      let query: any = db.collection(collection);

      // modelType 以 composite ID 前綴範圍篩選
      if (modelType) {
        query = query
          .where('data.id', '>=', `${collection}:${modelType}:`)
          .where('data.id', '<=', `${collection}:${modelType}:\uf8ff`)
          .orderBy('data.id');
      }

      // 欄位篩選 — 使用 Firestore 的 where equality
      if (filter) {
        for (const [field, value] of Object.entries(filter)) {
          if (!isSafeIdentifier(field)) continue;
          query = query.where(`data.${field}`, '==', value);
        }
      }

      // 排序：有 modelType 已固定 data.id 排序；無則依 updatedAt DESC
      if (!modelType) {
        query = query.orderBy('data.updatedAt', 'desc');
      }

      query = query.limit(limitNum);

      if (offsetNum > 0) {
        query = query.offset(offsetNum);
      }

      const snapshot = await query.get();
      const results: Record<string, unknown>[] = [];
      snapshot.forEach((doc: any) => {
        const obj = this.快照取資料(doc);
        if (obj) results.push(obj);
      });
      return results;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('index')) {
        // 無複合索引時，改用無排序查詢 + 記憶體過濾
        try {
          const db = this.拿到DB();
          let retryQuery: any = db.collection(collection);

          // 僅用 filter equality（不需複合索引）
          if (filter) {
            for (const [field, value] of Object.entries(filter)) {
              if (!isSafeIdentifier(field)) continue;
              retryQuery = retryQuery.where(`data.${field}`, '==', value);
            }
          }

          // modelType 改用記憶體過濾（避免 range + equality 仍需複合索引）
          retryQuery = retryQuery.limit(limitNum);
          if (offsetNum > 0) retryQuery = retryQuery.offset(offsetNum);

          const retrySnapshot = await retryQuery.get();
          let results: Record<string, unknown>[] = [];
          retrySnapshot.forEach((doc: any) => {
            const obj = this.快照取資料(doc);
            if (obj) results.push(obj);
          });

          // 記憶體中過濾 modelType
          if (modelType) {
            const prefix = `${collection}:${modelType}:`;
            results = results.filter((r) => {
              const id = r.id as string;
              return id >= prefix && id <= `${prefix}\uf8ff`;
            });
          }

          return results;
        } catch {
          await logError('FirestoreAdapter',
            `list 失敗 — 缺少 Composite Index。\n` +
            `請在 Firebase Console 為 collection "${collection}" 建立以下 Index：\n` +
            (filter ? `  欄位：${Object.keys(filter).map(f => `data.${f}`).join(', ')}\n` : '') +
            `  範圍：集合\n` +
            `或使用 Firebase CLI: firebase firestore:indexes`);
          return [];
        }
      }
      await logError('FirestoreAdapter', `list 失敗 (${collection}): ${msg}`);
      return [];
    }
  }

  async create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    const db = this.拿到DB();
    await db.collection(collection).doc(id).set({ data: dataWithId });
    return dataWithId;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = sanitizePayload(data, id);
    const db = this.拿到DB();
    await db.collection(collection).doc(id).set({ data: dataWithId });
    return dataWithId;
  }

  async queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      const db = this.拿到DB();
      // 預設限制讀取筆數，避免無限制讀取整張 collection 造成高額 Firestore Read 費用
      const limitNum = 50;

      // 先以 field equality 查詢（這個不需要複合索引）
      let query: any = db.collection(collection)
        .where(`data.${filter.field}`, '==', filter.value)
        .limit(limitNum);

      const snapshot = await query.get();

      let results: Record<string, unknown>[] = [];
      snapshot.forEach((doc: any) => {
        const obj = this.快照取資料(doc);
        if (obj) results.push(obj);
      });

      // 若有指定 modelType，在記憶體中過濾（避免 Firestore 複合索引缺失問題）
      if (modelType) {
        const prefix = `${collection}:${modelType}:`;
        results = results.filter((r) => {
          const id = r.id as string;
          return id >= prefix && id <= `${prefix}\uf8ff`;
        });
      }

      return results;
    } catch (err) {
      await logError('FirestoreAdapter', `queryByField 失敗 (${collection}, ${filter.field}): ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  async delete(id: string): Promise<boolean> {
    const collection = id.split(':')[0];
    try {
      const db = this.拿到DB();
      await db.collection(collection).doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  async patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const db = this.拿到DB();
      const docRef = db.collection(collection).doc(id);
      const updatedAtVal = fields.updatedAt || new Date().toISOString();

      // 以 dot notation（data.<field>）更新內部 JSON 欄位，維持 { data: {...} } 包裹結構
      const updatePayload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        updatePayload[`data.${key}`] = value;
      }
      updatePayload['data.updatedAt'] = updatedAtVal;

      await docRef.update(updatePayload);
      return await this.getById(id);
    } catch {
      return null;
    }
  }

  async count(collection: string, modelType?: string): Promise<number> {
    try {
      const db = this.拿到DB();
      let query: any = db.collection(collection);
      if (modelType) {
        query = query
          .where('data.id', '>=', `${collection}:${modelType}:`)
          .where('data.id', '<=', `${collection}:${modelType}:\uf8ff`)
          .orderBy('data.id');
      }
      const snapshot = await query.count().get();
      return snapshot.data().count;
    } catch {
      return 0;
    }
  }

  async initialize(_collection: string): Promise<void> {
    // Firestore collection 自動建立，不需 CREATE TABLE
  }

  /** 輕量連線檢查 */
  async ping(): Promise<boolean> {
    try {
      const db = this.拿到DB();
      await db.collection('_heartbeat_').limit(1).get();
      return true;
    } catch {
      return false;
    }
  }

  async 關閉(): Promise<void> {
    // Firebase SDK 不提供個別 app 的關閉，由 firebase-admin 自動管理
  }
}
