import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  duration?: number;
  format: string;
  bytes: number;
}

// Upload video to Cloudinary
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    resourceType?: 'video' | 'image';
    publicId?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'ibyegeranyo/documentaries',
      resource_type: options.resourceType || 'video',
      public_id: options.publicId,
      overwrite: true,
      invalidate: true,
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (result) {
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            duration: result.duration,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('Upload failed - no result'));
        }
      })
      .end(fileBuffer);
  });
}

// Import a public Vercel Blob in 20 MB chunks. Cloudinary's regular remote-URL
// upload endpoint rejects files over 100 MB, while this endpoint accepts video
// uploads in chunks without buffering the complete file in application memory.
export async function uploadUrlToCloudinary(
  sourceUrl: string,
  options: { folder?: string; resourceType?: 'video' | 'image' } = {}
): Promise<CloudinaryUploadResult> {
  const source = await fetch(sourceUrl);
  if (!source.ok || !source.body) {
    throw new Error(`Unable to read staged video: ${source.status} ${source.statusText}`);
  }
  const sourceBody = source.body;

  const result = await new Promise<Awaited<ReturnType<typeof cloudinary.uploader.upload>>>(
    (resolve, reject) => {
      const destination = cloudinary.uploader.upload_chunked_stream(
        {
          folder: options.folder || 'ibyegeranyo/documentaries',
          resource_type: options.resourceType || 'video',
          overwrite: true,
          invalidate: true,
          chunk_size: 20 * 1024 * 1024,
          timeout: 10 * 60 * 1000,
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else if (uploadResult) resolve(uploadResult);
          else reject(new Error('Upload failed - no result'));
        },
      );

      Readable.fromWeb(sourceBody as unknown as Parameters<typeof Readable.fromWeb>[0])
        .on('error', reject)
        .pipe(destination)
        .on('error', reject);
    },
  );

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    duration: result.duration,
    format: result.format,
    bytes: result.bytes,
  };
}

// Get video thumbnail from Cloudinary
export function getVideoThumbnail(publicId: string, options: {
  width?: number;
  height?: number;
  quality?: string;
} = {}): string {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    transformation: [
      {
        width: options.width || 640,
        height: options.height || 360,
        crop: 'fill',
      },
      {
        quality: options.quality || 'auto',
      },
    ],
    format: 'jpg',
  });
}

// Delete video from Cloudinary
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'video' | 'image' = 'video'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

// Get video details from Cloudinary
export async function getVideoDetails(publicId: string): Promise<CloudinaryUploadResult | null> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      duration: result.duration,
      format: result.format,
      bytes: result.bytes,
    };
  } catch {
    return null;
  }
}

export { cloudinary };
