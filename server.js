/**
 * server.js
 * Simple backend for admin authentication + documentary uploads.
 *
 * Requirements (based on your request):
 * - Uses relative paths for saving files into ./documentaries
 * - Stores metadata in ./documentaries/data.json
 * - Admin credentials: aime / campIO1!
 *
 * Run locally (for testing):
 *   node server.js
 * Then open: http://localhost:3000/admin.html and http://localhost:3000/
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import multer from 'multer';
import cookieParser from 'cookie-parser';


const APP_PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const ADMIN_USER = 'aime';
const ADMIN_PASS = 'campIO1!';

const ROOT = path.resolve(process.cwd());
const DOCS_DIR = path.join(ROOT, 'documentaries');
const DATA_PATH = path.join(DOCS_DIR, 'data.json');

// Ensure documentaries folder exists
fs.mkdirSync(DOCS_DIR, { recursive: true });

function sanitizeFilename(input){
  // Keep it filesystem safe.
  // Replace spaces with underscores, remove unsafe chars.
  const safe = String(input || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-\.\u00C0-\u017F]/g, '');
  return safe || 'untitled';
}

function readDataSync(){
  try{
    if(!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if(Array.isArray(parsed)) return parsed;
    return [];
  }catch{
    return [];
  }
}

async function readData(){
  try{
    const raw = await fsp.readFile(DATA_PATH, 'utf8').catch(()=> '[]');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch{
    return [];
  }
}

async function writeData(items){
  await fsp.mkdir(DOCS_DIR, { recursive: true });
  await fsp.writeFile(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

const app = express();
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Static site + admin.html
// Note: admin.html and index.html are served from root.
app.use(express.static(ROOT, { extensions: ['html'] }));

// CORS not required for same origin.

// Admin login session (simple signed-ish cookie for demo)
// For production you would use a proper session store.
function getSessionLoggedIn(req){
  return req.cookies && req.cookies.admin_logged_in === '1';
}

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if(String(username) === String(ADMIN_USER) && String(password) === String(ADMIN_PASS)){

    res.cookie('admin_logged_in', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    });
    return res.json({ ok: true, loggedIn: true });
  }

  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});


app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_logged_in');
  return res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => {
  return res.json({ loggedIn: getSessionLoggedIn(req) });
});

// Public list for viewers/admin to show uploaded documentaries
app.get('/api/documentaries', async (req, res) => {
  const items = await readData();
  const baseUrl = req.protocol + '://' + req.get('host');

  // Only expose public fields
  const publicItems = items.map(it => {
    const filename = it.filename;
    return {
      title: it.title,
      summary: it.summary,
      filename,
      url: `${baseUrl}/documentaries/${encodeURIComponent(filename)}`
    };
  });

  return res.json(publicItems);
});

// Multer storage config: store in documentaries folder, but we rename after upload.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
});

app.post('/api/documentaries/upload', getSessionLoggedIn ? (req, res, next) => {
  // middleware: login required
  if(!getSessionLoggedIn(req)){
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
} : (req, res) => res.status(401).json({ error: 'Unauthorized' }),
  upload.single('video'),
  async (req, res) => {
    try{
      const { title, summary } = req.body || {};
      const file = req.file;

      if(!title || !summary || !file){
        return res.status(400).json({ error: 'Missing title, summary, or video file' });
      }

      const ext = path.extname(file.originalname || '').toLowerCase();
      const sanitized = sanitizeFilename(title);
      const finalName = `${sanitized}${ext || '.mp4'}`;

      const finalPath = path.join(DOCS_DIR, finalName);

      // Save file bytes to disk
      await fsp.writeFile(finalPath, file.buffer);

      const items = await readData();

      // Upsert by title (or filename)
      const existingIndex = items.findIndex(x => String(x.title || '') === String(title || ''));
      const record = {
        title: String(title).trim(),
        summary: String(summary).trim(),
        filename: finalName,
        uploadedAt: new Date().toISOString()
      };

      if(existingIndex >= 0){
        items[existingIndex] = { ...items[existingIndex], ...record };
      }else{
        // Remove any record pointing to the same filename to avoid duplicates
        const filtered = items.filter(x => x.filename !== finalName);
        filtered.push(record);
        items.length = 0;
        items.push(...filtered);
      }

      await writeData(items);

      return res.json({ ok: true, filename: finalName });
    }catch(err){
      console.error(err);
      return res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// Fallback route for single-page (optional)
app.get('*', (req, res) => {
  // Serve index.html for SPA-ish navigation.
  // Keep admin.html accessible explicitly.
  if(req.path === '/admin' || req.path === '/admin/' ) return res.sendFile(path.join(ROOT, 'admin.html'));
  return res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(APP_PORT, () => {
  console.log(`Server running on http://localhost:${APP_PORT}`);
});

