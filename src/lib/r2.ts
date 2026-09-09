import { randomUUID } from 'node:crypto';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type R2AssetKind = 'documentary' | 'trailer' | 'thumbnail';

const videoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']);
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function required(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function r2Config() {
  return {
    endpoint: required('R2_S3_ENDPOINT').replace(/\/+$/, ''),
    bucket: required('R2_BUCKET_NAME'),
    accessKeyId: required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
  };
}

let r2ClockOffset: { milliseconds: number; expiresAt: number } | undefined;

/**
 * The signing host's clock can occasionally drift (notably during local
 * development). Read R2's Date header before presigning so URLs stay valid.
 */
async function getR2ClockOffset() {
  if (r2ClockOffset && r2ClockOffset.expiresAt > Date.now()) return r2ClockOffset.milliseconds;
  const { endpoint } = r2Config();
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    const r2Time = Date.parse(response.headers.get('date') || '');
    if (!Number.isNaN(r2Time)) {
      r2ClockOffset = { milliseconds: r2Time - Date.now(), expiresAt: Date.now() + 5 * 60 * 1000 };
      return r2ClockOffset.milliseconds;
    }
  } catch {
    // Let the SDK use its normal clock when the endpoint is temporarily down.
  }
  return 0;
}

export function validateR2Upload(kind: R2AssetKind, contentType: string, size: number) {
  const isVideo = kind === 'documentary' || kind === 'trailer';
  const limit = kind === 'documentary' ? 2 * 1024 ** 3 : kind === 'trailer' ? 500 * 1024 ** 2 : 10 * 1024 ** 2;
  if (!(isVideo ? videoTypes : imageTypes).has(contentType)) throw new Error(isVideo ? 'Invalid video file type' : 'Invalid thumbnail file type');
  if (!Number.isFinite(size) || size < 1 || size > limit) throw new Error(`File too large. Maximum size is ${limit / 1024 ** 2}MB`);
}

export function createR2ObjectKey(kind: R2AssetKind, filename: string, documentaryId?: string) {
  const extension = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || (kind === 'thumbnail' ? 'jpg' : 'mp4');
  const owner = documentaryId || `new-${randomUUID()}`;
  return `documentaries/${owner}/${kind}/${randomUUID()}.${extension}`;
}

/** Creates a short-lived, single-object PUT URL. R2 credentials never leave this module. */
export async function createPresignedR2PutUrl(key: string, expiresIn = 15 * 60) {
  const { bucket } = r2Config();
  const clockOffset = await getR2ClockOffset();
  return getSignedUrl(r2Client(), new PutObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn,
    signingDate: new Date(Date.now() + clockOffset),
  });
}

/**
 * A stable browser URL for the uploaded asset. The endpoint may be a public
 * R2 custom domain or a path-style R2 endpoint configured for public reads.
 */
export function r2ObjectUrl(key: string) {
  // Keep the bucket private: the media route streams R2 objects without ever
  // putting storage credentials or a long-lived public bucket URL in records.
  return `/api/media/r2?key=${encodeURIComponent(key)}`;
}

function r2Client() {
  const { endpoint, accessKeyId, secretAccessKey } = r2Config();
  return new S3Client({
    endpoint,
    region: 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    // R2 accepts normal S3 PUTs but does not need the SDK's optional CRC32
    // checksum query parameters, which make browser presigned PUTs fail.
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });
}

export async function assertR2ObjectExists(key: string) {
  const { bucket } = r2Config();
  return r2Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getR2Object(key: string, range?: string) {
  const { bucket } = r2Config();
  return r2Client().send(new GetObjectCommand({ Bucket: bucket, Key: key, ...(range ? { Range: range } : {}) }));
}
