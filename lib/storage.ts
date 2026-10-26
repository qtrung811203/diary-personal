import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { extractStorageKey } from "./storage-url";

const endpoint = process.env.MINIO_ENDPOINT!;
const bucket = process.env.MINIO_BUCKET!;
// In prod the S3 gateway's internal endpoint (used by this server to talk to
// it) and its public URL (used in <img src> by browsers, proxied via Nginx)
// differ. Defaults to `endpoint` so local dev needs no extra env var.
const publicUrlBase = process.env.MINIO_PUBLIC_URL ?? endpoint;

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

// Standard S3 bucket policy for public read — works the same on MinIO and
// SeaweedFS (and real S3), so switching backends doesn't need a different
// anonymous-access mechanism. Local dev's SeaweedFS already grants read via
// deploy/seaweedfs-s3-config.json's "anonymous" identity, so if this call
// isn't supported there it's swallowed rather than failing the request.
function publicReadPolicy() {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

function ensureBucket(): Promise<void> {
  if (!bucketEnsured) {
    bucketEnsured = s3
      .send(new HeadBucketCommand({ Bucket: bucket }))
      .catch(() => s3.send(new CreateBucketCommand({ Bucket: bucket })))
      .then(() =>
        s3
          .send(
            new PutBucketPolicyCommand({
              Bucket: bucket,
              Policy: publicReadPolicy(),
            })
          )
          .catch(() => undefined)
      )
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

  return `${publicUrlBase}/${bucket}/${key}`;
}

// Best-effort cleanup for a background image that's being replaced — if the
// key can't be determined (not one of our own URLs) or the delete fails,
// this is swallowed by the caller; a stray object is a storage-bloat
// nuisance, never worth failing the user's save over.
export async function deleteImageByUrl(url: string): Promise<void> {
  const key = extractStorageKey(url, bucket, publicUrlBase, endpoint);
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
