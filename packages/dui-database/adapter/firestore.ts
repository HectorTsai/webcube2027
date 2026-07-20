// Firestore (Google Firebase) Adapter — 使用 firebase-admin 實作 DatabaseAdapter
// 每個 model = 一個 Firestore collection，文件內以 data map 儲存完整記錄
//
// 連線資訊一律從 L2連線資訊 / L3連線資訊 的設定欄位傳入，不使用環境變數：
//   - projectId  ← L2連線資訊.主機 或 .資料庫名稱
//   - credential ← L2連線資訊.密碼（service account JSON 字串）
//   - databaseId ← L2連線資訊.命名空間（選用）

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Timestamp } from 'firebase-admin/firestore';
import type { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';

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

  async getById(model: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const db = this.拿到DB();
      const doc = await db.collection(model).doc(id).get();
      return this.快照取資料(doc);
    } catch {
      return null;
    }
  }

  async list(model: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    const offsetNum = options?.offset ?? 0;
    try {
      const db = this.拿到DB();
      let query: any = db.collection(model)
        .orderBy('data.updatedAt', 'desc')
        .limit(limitNum);

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
    } catch {
      return [];
    }
  }

  async create(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    const db = this.拿到DB();
    await db.collection(model).doc(id).set({ data: dataWithId });
    return dataWithId;
  }

  async update(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const 序列化資料 = typeof (data as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (data as { toJSON: () => Record<string, unknown> }).toJSON()
      : data;
    const dataWithId = { ...序列化資料, id, updatedAt: new Date().toISOString() };
    const db = this.拿到DB();
    await db.collection(model).doc(id).set({ data: dataWithId });
    return dataWithId;
  }

  async queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]> {
    try {
      const db = this.拿到DB();
      const snapshot = await db.collection(model)
        .where(`data.${filter.field}`, '==', filter.value)
        .get();

      const results: Record<string, unknown>[] = [];
      snapshot.forEach((doc: any) => {
        const obj = this.快照取資料(doc);
        if (obj) results.push(obj);
      });
      return results;
    } catch {
      return [];
    }
  }

  async delete(model: string, id: string): Promise<boolean> {
    try {
      const db = this.拿到DB();
      await db.collection(model).doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  async patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const db = this.拿到DB();
      const docRef = db.collection(model).doc(id);
      const updatedFields = { ...fields, updatedAt: fields.updatedAt || new Date().toISOString() };
      await docRef.update(updatedFields);
      const updated = await docRef.get();
      if (!updated.exists) return null;
      return { id, ...updated.data() } as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async count(model: string): Promise<number> {
    try {
      const db = this.拿到DB();
      const snapshot = await db.collection(model).count().get();
      return snapshot.data().count;
    } catch {
      return 0;
    }
  }

  async initialize(_model: string): Promise<void> {
    // Firestore collection 自動建立，不需 CREATE TABLE
  }

  async 關閉(): Promise<void> {
    // Firebase SDK 不提供個別 app 的關閉，由 firebase-admin 自動管理
  }
}
