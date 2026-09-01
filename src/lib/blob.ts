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
  const { uploadToCloudinary } = await import('./cloudinary');
  
  // Step 1: Upload to Vercel Blob
  const blobResult = await uploadToBlob(
    file,
    `temp/${Date.now()}-${file.name}`,
    { contentType: file.type }
  );

  if (options.onProgress) {
    options.onProgress(30);
  }

  // Step 2: Download from Blob as buffer
  const fileBuffer = await downloadFileAsBuffer(blobResult.url);

  if (options.onProgress) {
    options.onProgress(60);
  }

  // Step 3: Upload to Cloudinary
  const cloudinaryResult = await uploadToCloudinary(fileBuffer, {
    folder: options.folder || 'ibyegeranyo/documentaries',
    resourceType: 'video',
  });

  if (options.onProgress) {
    options.onProgress(90);
  }

  // Step 4: Clean up temporary blob
  try {
    await deleteFromBlob(blobResult.url);
  } catch {
    // Ignore cleanup errors
  }

  if (options.onProgress) {
    options.onProgress(100);
  }

  return {
    blobUrl: blobResult.url,
    cloudinaryPublicId: cloudinaryResult.publicId,
    cloudinarySecureUrl: cloudinaryResult.secureUrl,
    duration: cloudinaryResult.duration,
  };
}