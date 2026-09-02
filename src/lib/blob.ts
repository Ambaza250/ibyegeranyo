import { put, del, list } from '@vercel/blob';

// Upload file to Vercel Blob (temporary storage)
export async function uploadToBlob(
  file: File | Buffer,
  filename: string,
  options: {
    access?: 'public';
    contentType?: string;
  } = {}
): Promise<{ url: string; downloadUrl: string; pathname: string }> {
  const blob = await put(filename, file, {
    access: 'public',
    contentType: options.contentType,
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    pathname: blob.pathname,
  };
}

// Delete file from Vercel Blob
export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}

// List files in Vercel Blob
export async function listBlobs(prefix?: string): Promise<string[]> {
  const { blobs } = await list({
    prefix,
    limit: 1000,
  });
  return blobs.map((blob) => blob.url);
}

// Download file from URL and return as Buffer
export async function downloadFileAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Upload video through Vercel Blob then to Cloudinary
export async function uploadVideoPipeline(
  file: File,
  options: {
    folder?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<{
  blobUrl: string;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  duration?: number;
}> {
  const { uploadUrlToCloudinary } = await import('./cloudinary');
  
  // Step 1: Upload to Vercel Blob
  const blobResult = await uploadToBlob(
    file,
    `temp/${Date.now()}-${file.name}`,
    { contentType: file.type }
  );

  if (options.onProgress) {
    options.onProgress(30);
  }

  try {
    // Step 2: Cloudinary fetches the temporary public Blob itself. Do not
    // download the file into a Node Buffer: that would exceed most deployments'
    // memory limits for long-form video.
    const cloudinaryResult = await uploadUrlToCloudinary(blobResult.url, {
      folder: options.folder || 'ibyegeranyo/documentaries', resourceType: 'video',
    });
    if (options.onProgress) options.onProgress(90);
    if (options.onProgress) options.onProgress(100);
    return { blobUrl: blobResult.url, cloudinaryPublicId: cloudinaryResult.publicId, cloudinarySecureUrl: cloudinaryResult.secureUrl, duration: cloudinaryResult.duration };
  } finally {
    // Always clean up temporary storage, including Cloudinary failure paths.
    // A cleanup failure is intentionally non-fatal: the primary upload result
    // must not be hidden after Cloudinary has completed successfully.
    try { await deleteFromBlob(blobResult.url); } catch { /* best effort */ }
  }
}
