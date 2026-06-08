// MongoDB Adapter — 使用 npm:mongodb 實作 L3DatabaseAdapter 介面
// 每個 model = 一個 collection，文件原生 JSON 儲存（無序列化開銷）
// 適用於租戶自備 MongoDB 實例

import { MongoClient, type Db, type Collection } from 'mongodb';
import { L3DatabaseAdapter, 查詢選項 } from './adapter-interface.ts';
import { info, error } from '../../utils/logger.ts';

// MongoDB 文件型別 — _id 使用字串而非 ObjectId
interface WebCubeDoc {
  _id: string;
  [key: string]: unknown;
}

export class MongoAdapter implements L3DatabaseAdapter {
  readonly 類型 = 'mongodb';
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

  private async 取得集合(模型: string): Promise<Collection<WebCubeDoc>> {
    const db = await this.取得資料庫();
    const 集合名 = 模型.replace(/:/g, '_').toLowerCase();
    return db.collection<WebCubeDoc>(集合名);
  }

  async 查詢單一(模型: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const 集合 = await this.取得集合(模型);
      const doc = await 集合.findOne({ _id: id } as Record<string, unknown>);
      if (doc) {
        return doc as Record<string, unknown>;
      }
      return null;
    } catch (err) {
      await error('MongoAdapter', `查詢單一失敗: ${err}`);
      return null;
    }
  }

  async 查詢列表(模型: string, 選項: 查詢選項): Promise<Record<string, unknown>[]> {
    const limit = 選項.limit ?? 50;
    const offset = 選項.offset ?? 0;
    try {
      const 集合 = await this.取得集合(模型);
      const cursor = 集合
        .find()
        .sort({ 最後修改: -1 })
        .skip(offset)
        .limit(limit);
      return await cursor.toArray() as Record<string, unknown>[];
    } catch {
      return [];
    }
  }

  async 創建(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, _id: id, id, 最後修改: new Date() };
    try {
      const 集合 = await this.取得集合(模型);
      await 集合.insertOne(dataWithId as WebCubeDoc);
      return dataWithId;
    } catch (err) {
      await error('MongoAdapter', `創建失敗: ${err}`);
      return dataWithId;
    }
  }

  async 更新(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, _id: id, id, 最後修改: new Date() };
    try {
      const 集合 = await this.取得集合(模型);
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

  async 刪除(模型: string, id: string): Promise<boolean> {
    try {
      const 集合 = await this.取得集合(模型);
      const result = await 集合.deleteOne({ _id: id } as Record<string, unknown>);
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }

  async 個數(模型: string): Promise<number> {
    try {
      const 集合 = await this.取得集合(模型);
      return await 集合.countDocuments();
    } catch {
      return 0;
    }
  }

  async 初始化(模型: string): Promise<void> {
    try {
      const 集合 = await this.取得集合(模型);

      const count = await 集合.countDocuments();
      if (count > 0) return;

      const { 讀取種子 } = await import('../index.ts');
      const items = await 讀取種子(模型);

      if (items && items.length > 0) {
        const documents: WebCubeDoc[] = [];
        for (const 實例 of items) {
          try {
            await 實例.初始化();
            const json = 實例.toJSON();
            json._id = 實例.id;
            json.最後修改 = new Date();
            documents.push(json as WebCubeDoc);
          } catch (err) {
            await error('MongoAdapter', `匯入種子失敗 ${模型}/${實例.id}: ${err}`);
          }
        }

        if (documents.length > 0) {
          await 集合.insertMany(documents);
          await info('MongoAdapter', `${模型} 種子匯入完成，共 ${documents.length} 筆`);
        }
      }
    } catch (err) {
      await error('MongoAdapter', `初始化 ${模型} 失敗: ${err}`);
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
