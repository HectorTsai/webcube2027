// MongoDB Adapter — 使用 npm:mongodb 實作 DatabaseAdapter 介面
// 每個 collection = 一個 MongoDB collection，文件原生 JSON 儲存（無序列化開銷）
// 適用於租戶自備 MongoDB 實例

import { MongoClient, type Db, type Collection } from 'mongodb';
import { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { error } from '../logger.ts';

// MongoDB 文件型別 — _id 使用字串而非 ObjectId
interface WebCubeDoc {
  _id: string;
  [key: string]: unknown;
}

export class MongoAdapter implements DatabaseAdapter {
  readonly type = 'mongodb';
  private 連線字串: string;
  private 資料庫名稱: string;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private 已連線 = false;

  constructor(連線字串: string, 資料庫名稱: string = 'webcube') {
    this.連線字串 = 連線字串;
    this.資料庫名稱 = 資料庫名稱;
  }

  private async 取得資料庫(): Promise<Db> {
    if (!this.已連線) {
      this.client = new MongoClient(this.連線字串);
      await this.client.connect();
      this.db = this.client.db(this.資料庫名稱);
      this.已連線 = true;
    }
    return this.db!;
  }

  private async 取得集合(collection: string): Promise<Collection<WebCubeDoc>> {
    const db = await this.取得資料庫();
    const 集合名 = collection.replace(/:/g, '_').toLowerCase();
    return db.collection<WebCubeDoc>(集合名);
  }

  /** MongoDB 使用 _id 作為主鍵，讀取後正規化為 id 以符合系統一致格式 */
  private 正規化ID(doc: Record<string, unknown>): Record<string, unknown> {
    const { _id, ...rest } = doc;
    if (!rest.id && _id) {
      rest.id = _id as string;
    }
    return rest;
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const collection = id.split(':')[0];
    try {
      const 集合 = await this.取得集合(collection);
      const doc = await 集合.findOne({ _id: id } as Record<string, unknown>);
      if (doc) {
        return this.正規化ID(doc as Record<string, unknown>);
      }
      return null;
    } catch (err) {
      await error('MongoAdapter', `查詢單一失敗: ${err}`);
      return null;
    }
  }

  async list(collection: string, modelType?: string, options: QueryOptions = {}): Promise<Record<string, unknown>[]> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    try {
      const 集合 = await this.取得集合(collection);
      const filter: Record<string, unknown> = {};
      if (modelType) {
        // 以 _id（composite id）正則前綴篩選 model type
        filter._id = { $regex: `^${collection}:${modelType}:` };
      }
      const cursor = 集合
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit);
      const docs = await cursor.toArray() as Record<string, unknown>[];
      return docs.map(d => this.正規化ID(d));
    } catch {
      return [];
    }
  }

  async create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, _id: id, id, updatedAt: new Date() };
    try {
      const 集合 = await this.取得集合(collection);
      await 集合.insertOne(dataWithId as WebCubeDoc);
      return dataWithId;
    } catch (err) {
      await error('MongoAdapter', `創建失敗: ${err}`);
      return dataWithId;
    }
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, _id: id, id, updatedAt: new Date() };
    try {
      const 集合 = await this.取得集合(collection);
      await 集合.replaceOne(
        { _id: id } as Record<string, unknown>,
        dataWithId as WebCubeDoc,
        { upsert: true }
      );
      return dataWithId;
    } catch (err) {
      await error('MongoAdapter', `更新失敗: ${err}`);
      return dataWithId;
    }
  }

  async queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      const 集合 = await this.取得集合(collection);
      const query: Record<string, unknown> = { [filter.field]: filter.value };
      if (modelType) {
        query._id = { $regex: `^${collection}:${modelType}:` };
      }
      const cursor = 集合.find(query).limit(1);
      const docs = await cursor.toArray() as Record<string, unknown>[];
      return docs.map(d => this.正規化ID(d));
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<boolean> {
    const collection = id.split(':')[0];
    try {
      const 集合 = await this.取得集合(collection);
      const result = await 集合.deleteOne({ _id: id } as Record<string, unknown>);
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }

  async patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const db = await this.取得資料庫();
      const updatedFields = { ...fields, updatedAt: fields.updatedAt || new Date() };
      await db.collection(collection).updateOne({ _id: id } as Record<string, unknown>, { $set: updatedFields });
      return this.getById(id);
    } catch {
      return null;
    }
  }

  async count(collection: string, modelType?: string): Promise<number> {
    try {
      const 集合 = await this.取得集合(collection);
      if (modelType) {
        return await 集合.countDocuments({ _id: { $regex: `^${collection}:${modelType}:` } } as Record<string, unknown>);
      }
      return await 集合.countDocuments();
    } catch {
      return 0;
    }
  }

  async initialize(collection: string): Promise<void> {
    try {
      await this.取得集合(collection);
    } catch (err) {
      await error('MongoAdapter', `初始化 ${collection} 失敗: ${err}`);
    }
  }

  /** 關閉資料庫連線 */
  async 關閉(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.已連線 = false;
    }
  }
}
