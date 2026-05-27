import express from 'express';
import path from 'path';
import fsp from 'fs/promises';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const APP_PORT = process.env.PORT || 3000;

const ADMIN_USER = 'aime';
const ADMIN_PASS = 'campIO1!';

const app = express();
app.use(cookieParser());
app.use(express.static(path.resolve(process.cwd())));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use /tmp for data storage (Vercel compatible)
const DATA_DIR = '/tmp/documentaries';
const DATA_PATH = path.join(DATA_DIR, 'data.json');

// Routes
app.get('/', (req, res) => res.sendFile(path.resolve(process.cwd(), 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.resolve(process.cwd(), 'admin.html')));

// Admin Auth
app.post('/api/admin/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.cookie('admin', 'true', { httpOnly: true, maxAge: 3600000 });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin');
  res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => {
  res.json({ isLoggedIn: req.cookies.admin === 'true' });
});

// Upload Endpoint
app.post('/api/upload-documentary', upload.single('video'), async (req, res) => {
  try {
    const isAdmin = req.cookies.admin === 'true';
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });

    const { title, summary } = req.body;
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ error: 'Title and video file are required' });
    }

    const sanitizedTitle = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          public_id: sanitizedTitle,
          folder: "aime-christian-documentaries",
          overwrite: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    const metadata = {
      id: Date.now().toString(),
      title: title,
      summary: summary || '',
      url: result.secure_url,
      uploadedAt: new Date().toISOString()
    };

    await saveDocumentary(metadata);

    res.json({ success: true, url: result.secure_url });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

app.get('/api/documentaries', async (req, res) => {
  try {
    const docs = await readDocumentaries();
    res.json(docs);
  } catch (e) {
    res.json([]);
  }
});

async function readDocumentaries() {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const raw = await fsp.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveDocumentary(newDoc) {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const docs = await readDocumentaries();
    docs.unshift(newDoc);
    await fsp.writeFile(DATA_PATH, JSON.stringify(docs, null, 2));
  } catch (err) {
    console.error("Save Error:", err);
    throw err;
  }
}

app.listen(APP_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${APP_PORT}`);
});
