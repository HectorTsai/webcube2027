// Appwrite Adapter — 使用 node-appwrite 實作 DatabaseAdapter 介面
// 每個 model = 一個 Appwrite Collection
// 記錄以 data (JSON 字串) 儲存，另建立 updatedAt 屬性供伺服器端排序
//
// ⚠️ 重要限制
//   Collection 與其屬性必須預先在 Appwrite Console 中手動建立，否則初始化會失敗。
//   每個 collection 需包含以下屬性：
//     - data（string, max 1000000）
//     - updatedAt（datetime）
//
// 連線資訊對應（L2連線資訊 → Appwrite）：
//   主機  → endpoint（例如 https://cloud.appwrite.io/v1）
//   資料庫名稱 → project ID
//   密碼  → API Key
//   命名空間 → database ID（選用，預設 "default"）

import { Client, Databases, Query } from 'node-appwrite';
import type { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { info, error } from '../logger.ts';

export interface AppwriteConnectOptions {
  /** Appwrite 端點 URL，例如 https://cloud.appwrite.io/v1 */
  endpoint: string;
  /** Appwrite Project ID */
  project: string;
  /** Appwrite API Key（需有 documents 讀寫權限）*/
  apiKey: string;
  /** Appwrite Database ID（選用，預設 "default"）*/
  databaseId?: string;
}

export class AppwriteAdapter implements DatabaseAdapter {
  readonly type = 'appwrite';
  private databases!: Databases;
  private databaseId: string;
  private 選項: AppwriteConnectOptions;
  private 已初始化 = new Set<string>();

  constructor(選項: AppwriteConnectOptions) {
    this.選項 = 選項;
    this.databaseId = 選項.databaseId || 'default';
  }

  async connect(): Promise<void> {
    if (this.databases) return;

    const client = new Client()
      .setEndpoint(this.選項.endpoint)
      .setProject(this.選項.project)
      .setKey(this.選項.apiKey);

    this.databases = new Databases(client);

    // 確認 database 存在（必須預先建立）
    try {
      await this.databases.get(this.databaseId);
    } catch {
      await error('AppwriteAdapter', `Database "${this.databaseId}" 不存在，請先在 Appwrite Console 中建立`);
      throw new Error(`Appwrite Database "${this.databaseId}" 不存在`);
    }
  }

  private 拿到DB(): Databases {
    if (!this.databases) throw new Error('Appwrite Adapter 尚未初始化，請先呼叫 connect()');
    return this.databases;
  }

  async getById(model: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const db = this.拿到DB();
      const doc = await db.getDocument(this.databaseId, model, id);
      const raw = doc.data as string | undefined;
      if (!raw) return null;
      return {
        id: doc.$id,
        ...JSON.parse(raw),
        ...(doc.updatedAt ? { updatedAt: doc.updatedAt } : {}),
      };
    } catch {
      return null;
    }
  }

  async list(model: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    const offsetNum = options?.offset ?? 0;
    try {
      const db = this.拿到DB();
      const queries = [
        Query.orderDesc('updatedAt'),
        Query.limit(limitNum),
        Query.offset(offsetNum),
      ];
      const result = await db.listDocuments(this.databaseId, model, queries);
      return result.documents.map((doc: any) => {
        const data = typeof doc.data === 'string'
          ? JSON.parse(doc.data) as Record<string, unknown>
          : (doc.data as Record<string, unknown> ?? {});
        return {
          id: doc.$id,
          ...data,
          updatedAt: doc.updatedAt ?? data.updatedAt,
        };
      });
    } catch {
      return [];
    }
  }

  async create(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    const db = this.拿到DB();
    await db.createDocument(
      this.databaseId,
      model,
      id,
      {
        data: JSON.stringify(dataWithId),
        updatedAt: dataWithId.updatedAt,
      },
    );
    return dataWithId;
  }

  async update(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const 序列化資料 = typeof (data as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (data as { toJSON: () => Record<string, unknown> }).toJSON()
      : data;
    const dataWithId = { ...序列化資料, id, updatedAt: new Date().toISOString() };
    const db = this.拿到DB();
    await db.updateDocument(
      this.databaseId,
      model,
      id,
      {
        data: JSON.stringify(dataWithId),
        updatedAt: dataWithId.updatedAt,
      },
    );
    return dataWithId;
  }

  async queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]> {
    // Appwrite 無法對 JSON 字串內的欄位做伺服器端查詢
    // 這裡拉取所有文件後做客戶端過濾
    try {
      const db = this.拿到DB();
      const result = await db.listDocuments(this.databaseId, model);
      const matched: Record<string, unknown>[] = [];

      for (const doc of result.documents) {
        const raw = doc.data as string | undefined;
        if (!raw) continue;
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (String(data[filter.field]) === filter.value) {
          matched.push({
            id: doc.$id,
            ...data,
            updatedAt: doc.updatedAt ?? data.updatedAt,
          });
        }
      }

      return matched;
    } catch {
      return [];
    }
  }

  async delete(model: string, id: string): Promise<boolean> {
    try {
      const db = this.拿到DB();
      await db.deleteDocument(this.databaseId, model, id);
      return true;
    } catch {
      return false;
    }
  }

  async patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const db = this.拿到DB();
      const updatedFields = { ...fields, updatedAt: fields.updatedAt || new Date().toISOString() };
      const doc = await db.updateDocument(
        this.databaseId,
        model,
        id,
        updatedFields as any,
      );
      return {
        id: doc.$id,
        ...doc,
        updatedAt: doc.updatedAt || updatedFields.updatedAt,
      } as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async count(model: string): Promise<number> {
    try {
      const db = this.拿到DB();
      const result = await db.listDocuments(this.databaseId, model, [Query.limit(1)]);
      return result.total;
    } catch {
      return 0;
    }
  }

  async initialize(model: string): Promise<void> {
    if (this.已初始化.has(model)) return;
    try {
      // 確認 collection 存在（必須預先建立）
      await this.確認集合存在(model);
      this.已初始化.add(model);

      const count = await this.count(model);
      if (count === 0) {
        const { loadSeeds } = await import('../seed-loader.ts');
        const items = await loadSeeds(model);

        if (items && items.length > 0) {
          for (const 實例 of items) {
            try {
              await 實例.init();
              await this.create(model, 實例.id, 實例.toJSON());
            } catch (err) {
              await error('AppwriteAdapter', `匯入種子失敗 ${model}/${實例.id}: ${err}`);
            }
          }
          await info('AppwriteAdapter', `${model} 種子匯入完成，共 ${items.length} 筆`);
        }
      }
    } catch (err) {
      await error('AppwriteAdapter', `初始化 ${model} 失敗: ${err}`);
    }
  }

  /** 確認 Collection 已存在，不存在則 log 錯誤並拋出 */
  private async 確認集合存在(model: string): Promise<void> {
    const db = this.拿到DB();
    try {
      await db.getCollection(this.databaseId, model);
    } catch {
      const msg = `Collection "${model}" 不存在，請先在 Appwrite Console 中建立（需含 data string 與 updatedAt datetime 屬性）`;
      await error('AppwriteAdapter', msg);
      throw new Error(msg);
    }
  }

  async 關閉(): Promise<void> {
    // node-appwrite Client 無 close 方法，由 SDK 自動管理連線
  }
}
