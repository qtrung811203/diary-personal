import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const endpoint = process.env.MINIO_ENDPOINT!;
const bucket = process.env.MINIO_BUCKET!;

const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
});

let bucketEnsured: Promise<void> | null = null;

function ensureBucket(): Promise<void> {
  if (!bucketEnsured) {
    bucketEnsured = s3
      .send(new HeadBucketCommand({ Bucket: bucket }))
      .catch(() => s3.send(new CreateBucketCommand({ Bucket: bucket })))
      .then(() => undefined);
  }
  return bucketEnsured;
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function uploadImage(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await ensureBucket();

  const ext = EXTENSION_BY_TYPE[contentType] ?? "bin";
  const key = `${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${endpoint}/${bucket}/${key}`;
}
