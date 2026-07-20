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
import { info, error } from '../logger.ts';

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
  private 已初始化 = new Set<string>();

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

  async getById(model: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const client = this.拿到Client();
      const result = await client.send(new GetCommand({
        TableName: model,
        Key: { id },
      }));

      if (!result.Item) return null;
      const raw = result.Item.data as string | undefined;
      return raw ? { id, ...JSON.parse(raw), updatedAt: result.Item.updatedAt } : null;
    } catch {
      return null;
    }
  }

  async list(model: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    try {
      const client = this.拿到Client();
      const result = await client.send(new ScanCommand({
        TableName: model,
        Limit: limitNum,
      }));

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

  async create(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    const client = this.拿到Client();
    await client.send(new PutCommand({
      TableName: model,
      Item: {
        id,
        data: JSON.stringify(dataWithId),
        updatedAt: dataWithId.updatedAt,
      },
    }));
    return dataWithId;
  }

  async update(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // DynamoDB PutCommand 會覆蓋整個 Item，等同 upsert
    return this.create(model, id, data);
  }

  async queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]> {
    try {
      const client = this.拿到Client();
      const result = await client.send(new ScanCommand({
        TableName: model,
        FilterExpression: 'contains(#data, :val)',
        ExpressionAttributeNames: { '#data': 'data' },
        ExpressionAttributeValues: {
          ':val': `"${filter.field}"`,
        },
      }));

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

  async delete(model: string, id: string): Promise<boolean> {
    try {
      const client = this.拿到Client();
      await client.send(new DeleteCommand({
        TableName: model,
        Key: { id },
      }));
      return true;
    } catch {
      return false;
    }
  }

  async patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const client = this.拿到Client();
      const updatedAt = fields.updatedAt || new Date().toISOString();

      // Read current data
      const getResult = await client.send(new GetCommand({
        TableName: model,
        Key: { id },
      }));
      if (!getResult.Item) return null;

      const currentData = JSON.parse(getResult.Item.data.S || '{}') as Record<string, unknown>;
      const merged = { ...currentData, ...fields, updatedAt };

      // Write merged data back
      await client.send(new PutCommand({
        TableName: model,
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

  async count(model: string): Promise<number> {
    try {
      const client = this.拿到Client();
      const result = await client.send(new ScanCommand({
        TableName: model,
        Select: 'COUNT',
      }));
      return result.Count ?? 0;
    } catch {
      return 0;
    }
  }

  async initialize(model: string): Promise<void> {
    if (this.已初始化.has(model)) return;
    try {
      // 檢查 Table 是否存在（必須預先建立）
      const client = new DynamoDBClient({ region: this.選項.region });

      try {
        await client.send(new DescribeTableCommand({ TableName: model }));
      } catch {
        const msg = `DynamoDB Table "${model}" 不存在，請先在 AWS Console 中建立（需含 id(String) 作為 Partition Key）`;
        await error('DynamoDBAdapter', msg);
        throw new Error(msg);
      }

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
              await error('DynamoDBAdapter', `匯入種子失敗 ${model}/${實例.id}: ${err}`);
            }
          }
          await info('DynamoDBAdapter', `${model} 種子匯入完成，共 ${items.length} 筆`);
        }
      }
    } catch (err) {
      await error('DynamoDBAdapter', `初始化 ${model} 失敗: ${err}`);
    }
  }

  async 關閉(): Promise<void> {
    // DynamoDBDocumentClient 無需手動關閉
  }
}
