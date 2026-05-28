// server.js - FULL UPDATED VERSION (May 2026)
import express from 'express';
import path from 'path';
import fsp from 'fs/promises';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APP_PORT = process.env.PORT || 3000;

const ADMIN_USER = 'aime';
const ADMIN_PASS = 'campIO1!';

const app = express();
app.use(cookieParser());
app.use(express.static(path.resolve(process.cwd())));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// ====================== CLOUDINARY ======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ====================== FIREBASE ADMIN ======================
const firebaseAdmin = initializeApp({
  projectId: "ibyegeranyo-6e49b",
});

const db = getFirestore(firebaseAdmin);

// ====================== DATA PATHS ======================
const PAYMENTS_DIR = '/tmp/payments';
const PAYMENTS_PATH = path.join(PAYMENTS_DIR, 'payments.json');

// ====================== HELPERS ======================
function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

async function readPayments() {
  try {
    await fsp.mkdir(PAYMENTS_DIR, { recursive: true });
    const raw = await fsp.readFile(PAYMENTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePayments(payments) {
  await fsp.mkdir(PAYMENTS_DIR, { recursive: true });
  await fsp.writeFile(PAYMENTS_PATH, JSON.stringify(payments, null, 2));
}

function computeExpiresAtFromPlan(planType) {
  const p = String(planType || '').toLowerCase();
  const now = Date.now();
  const msDay = 24 * 60 * 60 * 1000;

  if (p === 'weekly') return new Date(now + 7 * msDay).toISOString();
  if (p === 'yearly') return new Date(now + 365 * msDay).toISOString();
  return new Date(now + 30 * msDay).toISOString(); // monthly default
}

function isPaymentActive(payment) {
  if (!payment || payment.status !== 'confirmed') return false;
  if (!payment.expiresAt) return true;
  return new Date(payment.expiresAt).getTime() > Date.now();
}

// ====================== ROUTES ======================
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

// ====================== PAYMENTS ======================
app.post('/api/payments/create', express.json(), async (req, res) => {
  try {
    const { fullName, phone, momoPassword, planType, amount } = req.body || {};

    const normalizedPhone = normalizePhone(phone);
    if (!fullName || String(fullName).trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }
    if (!momoPassword || String(momoPassword).length < 4) {
      return res.status(400).json({ error: 'Momo password is required' });
    }

    const amtNum = Number(amount);
    if (!Number.isFinite(amtNum) || amtNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const record = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullName: String(fullName).trim(),
      phone: normalizedPhone,
      momoPassword: String(momoPassword),
      planType: String(planType || '').trim(),
      amount: amtNum,
      status: 'pending',
      screenshotUrl: null,
      confirmedAt: null,
      expiresAt: computeExpiresAtFromPlan(planType)
    };

    const payments = await readPayments();
    payments.unshift(record);
    await savePayments(payments);

    res.json({ success: true, paymentId: record.id });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment' });
  }
});

// ====================== SCREENSHOT UPLOAD (Cloudinary + Smart Naming) ======================
app.post('/api/payments/upload-proof', upload.single('screenshot'), async (req, res) => {
  try {
    const { paymentId, fullName } = req.body;
    const file = req.file;
    if (!paymentId || !file) {
      return res.status(400).json({ error: 'Missing paymentId or screenshot file' });
    }

    const payments = await readPayments();
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // naming system: name + payment date
    const cleanName = String(fullName || payment.fullName || 'user')
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();

    // include paymentId + timestamp to avoid collisions
    const publicId = `${cleanName}-${dateStr}-${payment.id}-${Date.now()}`;


    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: 'image',
        public_id: publicId,
        folder: 'aime-christian-momo-proofs',
        overwrite: true
      }, (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      }).end(file.buffer);
    });

    payment.screenshotUrl = result.secure_url;
    payment.updatedAt = new Date().toISOString();

    await savePayments(payments);

    res.json({ 
      success: true, 
      screenshotUrl: result.secure_url,
      message: 'Screenshot uploaded successfully'
    });
  } catch (err) {
    console.error('Upload proof error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ====================== ADMIN ROUTES ======================
app.get('/api/admin/payments', async (req, res) => {
  if (req.cookies.admin !== 'true') return res.status(401).json({ error: 'Unauthorized' });
  
  const payments = await readPayments();
  res.json(payments);
});

app.post('/api/admin/verify-payment', express.json(), async (req, res) => {
  if (req.cookies.admin !== 'true') return res.status(401).json({ error: 'Unauthorized' });

  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'Payment ID required' });

  const payments = await readPayments();
  const payment = payments.find(p => p.id === paymentId);

  if (payment) {
    payment.status = 'confirmed';
    payment.confirmedAt = new Date().toISOString();
    await savePayments(payments);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Payment not found' });
  }
});

// ====================== DOCUMENTARIES ======================
app.get('/api/documentaries', async (req, res) => {
  try {
    const snapshot = await db.collection('documentaries')
      .orderBy('uploadedAt', 'desc')
      .get();

    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(docs);
  } catch (error) {
    console.error('Error fetching documentaries:', error);
    res.status(500).json([]);
  }
});

// Upload Documentary → Cloudinary + Firestore
app.post('/api/upload-documentary', upload.single('video'), async (req, res) => {
  try {
    if (req.cookies.admin !== 'true') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, summary } = req.body;
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ error: 'Title and video file are required' });
    }

    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const publicId = `documentaries/${sanitizedTitle}-${Date.now()}`;

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: 'video',
        public_id: publicId,
        folder: 'aime-christian-documentaries',
        chunk_size: 6000000
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(file.buffer);
    });

    const docData = {
      title: title.trim(),
      summary: (summary || '').trim(),
      cloudinaryUrl: uploadResult.secure_url,
      thumbnail: uploadResult.thumbnail_url || null,
      duration: 'HD',
      uploadedAt: new Date().toISOString()
    };

    const docRef = await db.collection('documentaries').add(docData);

    res.json({
      success: true,
      id: docRef.id,
      documentary: docData
    });
  } catch (error) {
    console.error('Upload documentary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check user access
app.get('/api/me/access', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json({ hasAccess: false });

    const normalizedPhone = normalizePhone(phone);
    const payments = await readPayments();

    const activePayment = payments.find(p => 
      p.phone === normalizedPhone && isPaymentActive(p)
    );

    res.json({ hasAccess: !!activePayment });
  } catch (e) {
    res.json({ hasAccess: false });
  }
});

app.listen(APP_PORT, () => {
  console.log(`🚀 Server running on port ${APP_PORT}`);
});
