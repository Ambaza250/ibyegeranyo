# TODO

## Vercel Blob admin upload troubleshooting

- [ ] Inspect client code paths for document upload (admin.html)
- [ ] Add client fallback behavior to avoid requiring Vercel Blob write token in browser
- [ ] When fallback runs, identify why server returns `Internal Server Error` for `/api/upload-documentary`
- [ ] Add request/endpoint logging + centralized Express error handler in `server.js`
- [ ] Retry upload and capture server log output showing the real exception
- [ ] Fix root cause (Cloudinary config, missing tmp-uploads file, auth cookie, multer parsing, Firestore init, etc.)

