# TODO

- [ ] Add server endpoint to create a short-lived Vercel Blob signed upload (no browser write token).
- [ ] Update admin.html upload flow to request the signed upload from server, then upload to Blob using only the signed URL/capability.
- [ ] Remove/disable current window.BLOB_READ_WRITE_TOKEN/VERCEL_BLOB_WRITE_TOKEN checks and related debug logging.
- [ ] Ensure `/api/documentaries/upload-from-blob` still receives `blobUrl` and Cloudinary upload works.
- [ ] Test end-to-end upload from admin page.

