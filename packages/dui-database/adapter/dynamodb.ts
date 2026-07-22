// DynamoDB Adapter — 使用 @aws-sdk/lib-dynamodb 實作 DatabaseAdapter 介面
// 每個 model = 一個 DynamoDB Table
// 記錄以 data (JSON 字串) 儲存，另建立 updatedAt 屬性供排序
//
// ⚠️ 重要限制
//   DynamoDB Table 必須預先在 AWS Console / CDK / Terraform 中建立，
//   並以 id (String) 作為 Partition Key。
//   初始化時不會自動建立 Table。
//
// 連線資訊對應（L2連線資訊 → DynamoDB）：
//   主機  → AWS Region（例如 ap-northeast-1）
//   使用者名稱 → AWS Access Key ID（選用，可透過環境變數或 IAM Role）
//   密碼  → AWS Secret Access Key（選用）

import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { error } from '../logger.ts';

export interface DynamoDBConnectOptions {
  /** AWS Region，例如 "ap-northeast-1" */
  region: string;
  /** AWS Access Key ID（選用，也可透過環境變數或 IAM Role）*/
  accessKeyId?: string;
  /** AWS Secret Access Key（選用）*/
  secretAccessKey?: string;
}

export class DynamoDBAdapter implements DatabaseAdapter {
  readonly type = 'dynamodb';
  private docClient!: DynamoDBDocumentClient;

  constructor(private 選項: DynamoDBConnectOptions) {
  }

  connect(): void {
    if (this.docClient) return;

    const client = new DynamoDBClient({
      region: this.選項.region,
      credentials: this.選項.accessKeyId && this.選項.secretAccessKey
        ? {
            accessKeyId: this.選項.accessKeyId,
            secretAccessKey: this.選項.secretAccessKey,
          }
        : undefined, // 使用預設 credential chain（env / IAM Role）
    });

    this.docClient = DynamoDBDocumentClient.from(client);
  }

  private 拿到Client(): DynamoDBDocumentClient {
    if (!this.docClient) throw new Error('DynamoDB Adapter 尚未初始化，請先呼叫 connect()');
    return this.docClient;
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const collection = id.split(':')[0];
    try {
      const client = this.拿到Client();
      const result = await client.send(new GetCommand({
        TableName: collection,
        Key: { id },
      }));

      if (!result.Item) return null;
      const raw = result.Item.data as string | undefined;
      return raw ? { id, ...JSON.parse(raw), updatedAt: result.Item.updatedAt } : null;
    } catch {
      return null;
    }
  }

  async list(collection: string, modelType?: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    try {
      const client = this.拿到Client();
      const scanParams: Record<string, unknown> = {
        TableName: collection,
        Limit: limitNum,
      };
      if (modelType) {
        scanParams['FilterExpression'] = 'begins_with(#id, :prefix)';
        scanParams['ExpressionAttributeNames'] = { '#id': 'id' };
        scanParams['ExpressionAttributeValues'] = { ':prefix': `${collection}:${modelType}:` };
      }
      const result = await client.send(new ScanCommand(scanParams as any));

      return (result.Items ?? []).map((item: any) => {
        const raw = typeof item.data === 'string'
          ? JSON.parse(item.data) as Record<string, unknown>
          : (item.data as Record<string, unknown> ?? {});
        return { id: item.id, ...raw, updatedAt: item.updatedAt ?? raw.updatedAt };
      });
    } catch {
      return [];
    }
  }

  async create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    const client = this.拿到Client();
    await client.send(new PutCommand({
      TableName: collection,
      Item: {
        id,
        data: JSON.stringify(dataWithId),
        updatedAt: dataWithId.updatedAt,
      },
    }));
    return dataWithId;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // DynamoDB PutCommand 會覆蓋整個 Item，等同 upsert
    return this.create(collection, id, data);
  }

  async queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      const client = this.拿到Client();
      const scanParams: Record<string, unknown> = {
        TableName: collection,
        FilterExpression: 'contains(#data, :val)',
        ExpressionAttributeNames: { '#data': 'data' },
        ExpressionAttributeValues: {
          ':val': `"${filter.field}"`,
        },
      };
      if (modelType) {
        scanParams['FilterExpression'] = 'contains(#data, :val) AND begins_with(#id, :prefix)';
        scanParams['ExpressionAttributeNames'] = { '#data': 'data', '#id': 'id' };
        scanParams['ExpressionAttributeValues'] = {
          ':val': `"${filter.field}"`,
          ':prefix': `${collection}:${modelType}:`,
        };
      }
      const result = await client.send(new ScanCommand(scanParams as any));

      const matched: Record<string, unknown>[] = [];
      for (const item of result.Items ?? []) {
        const raw = item.data as string | undefined;
        if (!raw) continue;
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (String(data[filter.field]) === filter.value) {
          matched.push({ id: item.id, ...data, updatedAt: item.updatedAt ?? data.updatedAt });
        }
      }
      return matched;
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<boolean> {
    const collection = id.split(':')[0];
    try {
      const client = this.拿到Client();
      await client.send(new DeleteCommand({
        TableName: collection,
        Key: { id },
      }));
      return true;
    } catch {
      return false;
    }
  }

  async patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const client = this.拿到Client();
      const updatedAt = fields.updatedAt || new Date().toISOString();

      // Read current data
      const getResult = await client.send(new GetCommand({
        TableName: collection,
        Key: { id },
      }));
      if (!getResult.Item) return null;

      const currentData = JSON.parse(getResult.Item.data.S || '{}') as Record<string, unknown>;
      const merged = { ...currentData, ...fields, updatedAt };

      // Write merged data back
      await client.send(new PutCommand({
        TableName: collection,
        Item: {
          id,
          data: JSON.stringify(merged),
          updatedAt,
        },
      }));
      return merged;
    } catch {
      return null;
    }
  }

  async count(collection: string, modelType?: string): Promise<number> {
    try {
      const client = this.拿到Client();
      const scanParams: Record<string, unknown> = {
        TableName: collection,
        Select: 'COUNT',
      };
      if (modelType) {
        scanParams['FilterExpression'] = 'begins_with(#id, :prefix)';
        scanParams['ExpressionAttributeNames'] = { '#id': 'id' };
        scanParams['ExpressionAttributeValues'] = { ':prefix': `${collection}:${modelType}:` };
      }
      const result = await client.send(new ScanCommand(scanParams as any));
      return result.Count ?? 0;
    } catch {
      return 0;
    }
  }

  async initialize(collection: string): Promise<void> {
    try {
      // 檢查 Table 是否存在（必須預先建立）
      const client = new DynamoDBClient({ region: this.選項.region });

      try {
        await client.send(new DescribeTableCommand({ TableName: collection }));
      } catch {
        const msg = `DynamoDB Table "${collection}" 不存在，請先在 AWS Console 中建立（需含 id(String) 作為 Partition Key）`;
        await error('DynamoDBAdapter', msg);
        throw new Error(msg);
      }
    } catch (err) {
      await error('DynamoDBAdapter', `初始化 ${collection} 失敗: ${err}`);
    }
  }

  async 關閉(): Promise<void> {
    // DynamoDBDocumentClient 無需手動關閉
  }
}
