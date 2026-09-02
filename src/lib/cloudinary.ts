import { v2 as cloudinary } from 'cloudinary';

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

// Let Cloudinary fetch a public Vercel Blob directly. This avoids buffering a
// potentially multi-gigabyte video in the serverless function's memory.
export async function uploadUrlToCloudinary(
  sourceUrl: string,
  options: { folder?: string; resourceType?: 'video' | 'image' } = {}
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(sourceUrl, {
    folder: options.folder || 'ibyegeranyo/documentaries',
    resource_type: options.resourceType || 'video',
    overwrite: true,
    invalidate: true,
  });
  return { publicId: result.public_id, secureUrl: result.secure_url, duration: result.duration, format: result.format, bytes: result.bytes };
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
