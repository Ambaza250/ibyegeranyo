/**
 * server.js - With Title & Summary Support
 */

import express from 'express';
import path from 'path';
import fsp from 'fs/promises';
import cookieParser from 'cookie-parser';
import { put } from '@vercel/blob';

const APP_PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const ADMIN_USER = 'aime';
const ADMIN_PASS = 'campIO1!';

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(cookieParser());
app.use(express.static(path.resolve(process.cwd())));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'admin.html'));
});

// Admin Auth
app.post('/api/admin/login', (req, res) => {
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
  const isAdmin = req.cookies.admin === 'true';
  res.json({ isLoggedIn: isAdmin });
});

// ===================== UPLOAD WITH TITLE & SUMMARY =====================
app.post('/api/upload-documentary', async (req, res) => {
  const isAdmin = req.cookies.admin === 'true';
  if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { title, summary, filename, contentType } = req.body;

    if (!title || !filename) {
      return res.status(400).json({ error: 'Title and file are required' });
    }

    // Sanitize title for filename
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const extension = filename.split('.').pop();
    const blobName = `${sanitizedTitle}.${extension}`;

    const { url } = await put(blobName, '', {
      access: 'public',
      contentType: contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    res.json({ success: true, url, title, sanitizedTitle });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save documentary metadata
app.post('/api/save-documentary', async (req, res) => {
  const isAdmin = req.cookies.admin === 'true';
  if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { title, summary, videoUrl } = req.body;

    const metadata = {
      id: Date.now().toString(),
      title: title,
      summary: summary || '',
      url: videoUrl,
      uploadedAt: new Date().toISOString()
    };

    await saveDocumentary(metadata);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
  const DATA_PATH = path.join(process.cwd(), 'documentaries', 'data.json');
  try {
    const raw = await fsp.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveDocumentary(newDoc) {
  const DATA_DIR = path.join(process.cwd(), 'documentaries');
  const DATA_PATH = path.join(DATA_DIR, 'data.json');
  
  await fsp.mkdir(DATA_DIR, { recursive: true });
  
  const docs = await readDocumentaries();
  docs.unshift(newDoc);
  await fsp.writeFile(DATA_PATH, JSON.stringify(docs, null, 2));
}

app.listen(APP_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${APP_PORT}`);
});
