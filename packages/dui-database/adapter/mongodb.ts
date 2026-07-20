// MongoDB Adapter — 使用 npm:mongodb 實作 DatabaseAdapter 介面
// 每個 model = 一個 collection，文件原生 JSON 儲存（無序列化開銷）
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

  private async 取得集合(model: string): Promise<Collection<WebCubeDoc>> {
    const db = await this.取得資料庫();
    const 集合名 = model.replace(/:/g, '_').toLowerCase();
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

  async getById(model: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const 集合 = await this.取得集合(model);
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

  async list(model: string, options: QueryOptions): Promise<Record<string, unknown>[]> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    try {
      const 集合 = await this.取得集合(model);
      const cursor = 集合
        .find()
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit);
      const docs = await cursor.toArray() as Record<string, unknown>[];
      return docs.map(d => this.正規化ID(d));
    } catch {
      return [];
    }
  }

  async create(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, _id: id, id, updatedAt: new Date() };
    try {
      const 集合 = await this.取得集合(model);
      await 集合.insertOne(dataWithId as WebCubeDoc);
      return dataWithId;
    } catch (err) {
      await error('MongoAdapter', `創建失敗: ${err}`);
      return dataWithId;
    }
  }

  async update(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, _id: id, id, updatedAt: new Date() };
    try {
      const 集合 = await this.取得集合(model);
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

  async queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]> {
    try {
      const 集合 = await this.取得集合(model);
      const cursor = 集合.find({ [filter.field]: filter.value } as Record<string, unknown>).limit(1);
      const docs = await cursor.toArray() as Record<string, unknown>[];
      return docs.map(d => this.正規化ID(d));
    } catch {
      return [];
    }
  }

  async delete(model: string, id: string): Promise<boolean> {
    try {
      const 集合 = await this.取得集合(model);
      const result = await 集合.deleteOne({ _id: id } as Record<string, unknown>);
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }

  async patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const db = await this.取得資料庫();
      const updatedFields = { ...fields, updatedAt: fields.updatedAt || new Date() };
      await db.collection(model).updateOne({ _id: id } as Record<string, unknown>, { $set: updatedFields });
      return this.getById(model, id);
    } catch {
      return null;
    }
  }

  async count(model: string): Promise<number> {
    try {
      const 集合 = await this.取得集合(model);
      return await 集合.countDocuments();
    } catch {
      return 0;
    }
  }

  async initialize(model: string): Promise<void> {
    try {
      await this.取得集合(model);
    } catch (err) {
      await error('MongoAdapter', `初始化 ${model} 失敗: ${err}`);
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
