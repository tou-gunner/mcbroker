import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

const globalForS3 = globalThis as unknown as { s3?: S3Client };

export const s3 =
  globalForS3.s3 ??
  new S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
  });

if (process.env.NODE_ENV !== "production") globalForS3.s3 = s3;

export const S3_BUCKET = process.env.S3_BUCKET!;
export const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL!;

export function publicUrl(key: string): string {
  return `${S3_PUBLIC_BASE_URL}/${key}`;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export const ALLOWED_IMAGE_TYPES = Object.keys(MIME_TO_EXT);

export function extForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

export function keyFromPublicUrl(url: string): string | null {
  const prefix = `${S3_PUBLIC_BASE_URL}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export type S3Object = { key: string; size: number; lastModified: Date };

export async function listObjects(prefix: string): Promise<S3Object[]> {
  const results: S3Object[] = [];
  let continuationToken: string | undefined;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const o of res.Contents ?? []) {
      if (o.Key && o.Size !== undefined && o.LastModified) {
        results.push({ key: o.Key, size: o.Size, lastModified: o.LastModified });
      }
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);
  return results;
}

export async function copyObject(fromKey: string, toKey: string): Promise<void> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: S3_BUCKET,
      CopySource: `${S3_BUCKET}/${fromKey}`,
      Key: toKey,
    }),
  );
}

export async function deleteObjects(keys: string[]): Promise<number> {
  let deleted = 0;
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    const res = await s3.send(
      new DeleteObjectsCommand({
        Bucket: S3_BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      }),
    );
    deleted += res.Deleted?.length ?? 0;
  }
  return deleted;
}
