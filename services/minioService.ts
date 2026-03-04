import { Client } from "minio";
import { nanoid } from "nanoid";
import sharp from "sharp";

// MinIO 策略常量
const BUCKET_MEDIA = "media";
const BUCKET_THUMB = "thumb";
const SIGNED_URL_EXPIRY_MEDIA = 3600; // 1 小時
const SIGNED_URL_EXPIRY_THUMB = 86400; // 24 小時
const THUMB_SIZE = 800; // 縮圖寬度 800px

export class MinioService {
  private client: Client;

  constructor(endpoint: string, accessKey: string, secretKey: string, useSSL = true) {
    this.client = new Client({
      endPoint: endpoint,
      accessKey,
      secretKey,
      useSSL,
    });
  }

  async ensureBuckets() {
    const buckets = [BUCKET_MEDIA, BUCKET_THUMB];
    for (const bucket of buckets) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
        // 設定 bucket 為私有（無公共讀取）
        await this.client.setBucketPolicy(bucket, JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: "*" },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucket}/*`],
              Condition: {
                StringEquals: {
                  "s3:signatureversion": "AWS4-HMAC-SHA256"
                }
              }
            }
          ]
        }));
      }
    }
  }

  private generateKey(domain: string, type: string, ext: string, isThumb = false, sizePreset?: string): string {
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const uuid = nanoid();
    if (isThumb) {
      return `${domain}/thumb/${sizePreset}/${yyyy}/${mm}/${dd}/${uuid}.webp`;
    } else {
      return `${domain}/${type}/${yyyy}/${mm}/${dd}/${uuid}.${ext}`;
    }
  }

  async uploadMedia(domain: string, type: string, file: Uint8Array, ext: string, metadata: Record<string, string>) {
    const key = this.generateKey(domain, type, ext);
    await this.client.putObject(BUCKET_MEDIA, key, file, metadata);
    return { bucket: BUCKET_MEDIA, key };
  }

  async uploadThumb(domain: string, sizePreset: string, file: Uint8Array) {
    const key = this.generateKey(domain, "image", "webp", true, sizePreset);
    await this.client.putObject(BUCKET_THUMB, key, file);
    return { bucket: BUCKET_THUMB, key };
  }

  async generateThumbnail(imageBuffer: Uint8Array): Promise<Uint8Array> {
    return await sharp(imageBuffer)
      .resize(THUMB_SIZE, null, { withoutEnlargement: true })
      .webp()
      .toBuffer();
  }

  getSignedUrl(bucket: string, key: string): string {
    const expiry = bucket === BUCKET_MEDIA ? SIGNED_URL_EXPIRY_MEDIA : SIGNED_URL_EXPIRY_THUMB;
    return this.client.presignedGetObject(bucket, key, expiry);
  }

  async getObjectInfo(bucket: string, key: string) {
    return await this.client.statObject(bucket, key);
  }
}
