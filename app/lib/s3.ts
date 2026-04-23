import { S3Client } from "@aws-sdk/client-s3";

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
