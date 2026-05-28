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

// Fail fast if Cloudinary credentials are missing
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('[Cloudinary] Missing credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in environment variables.');
}

// Use /tmp for data storage (Vercel compatible)
const DATA_DIR = '/tmp/documentaries';
const DATA_PATH = path.join(DATA_DIR, 'data.json');

const PAYMENTS_DIR = '/tmp/documentaries';
const PAYMENTS_PATH = path.join(PAYMENTS_DIR, 'payments.json');

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

app.get('/api/admin/me', (req, res) => {
  res.json({ loggedIn: req.cookies.admin === 'true' });
});

function requireAdmin(req, res) {
  const isAdmin = req.cookies.admin === 'true';
  if (!isAdmin) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

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
  if (p === 'single') return new Date(now + 30 * msDay).toISOString();
  return new Date(now + 30 * msDay).toISOString();
}

function isPaymentActive(payment) {
  if (!payment || payment.status !== 'confirmed') return false;
  if (!payment.expiresAt) return true; // backward compatibility
  const exp = new Date(payment.expiresAt).getTime();
  if (!Number.isFinite(exp)) return false;
  return exp > Date.now();
}

function computeUsseForMtnMoMo({ phone, amount, momoCode }) {
  const p = normalizePhone(phone);
  return `*182*8*${momoCode}*${p}*${amount}#`;
}

// Create payment request (used by current pay flow)
app.post('/api/payments/create', express.json(), async (req, res) => {
  try {
    const {
      fullName,
      phone,
      momoPassword,
      planType,
      amount,
      documentaryIds
    } = req.body || {};

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

    const momoCode = '12345';
    const ussd = computeUsseForMtnMoMo({ phone: normalizedPhone, amount: amtNum, momoCode });

    const record = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullName: String(fullName).trim(),
      phone: normalizedPhone,
      momoPassword: String(momoPassword),
      planType: String(planType || '').trim(),
      amount: amtNum,
      documentaryIds: Array.isArray(documentaryIds)
        ? documentaryIds
        : typeof documentaryIds === 'string' && documentaryIds.trim()
          ? documentaryIds.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      status: 'pending',
      ussd,
      screenshotUrl: null,
      confirmedAt: null,
      expiresAt: null
    };

    const payments = await readPayments();
    payments.unshift(record);
    await savePayments(payments);

    res.json({ success: true, paymentId: record.id, ussd });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment' });
  }
});

// Upload momo screenshot proof (legacy: by paymentId)
app.post('/api/payments/upload-proof', upload.single('screenshot'), async (req, res) => {
  try {
    const paymentId = String(req.body?.paymentId || '');
    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'screenshot is required' });

    const payments = await readPayments();
    const idx = payments.findIndex(p => p.id === paymentId);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'aime-christian-momo-proofs',
          public_id: `payment-${paymentId}-${Date.now()}`,
          overwrite: true
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      ).end(file.buffer);
    });

    payments[idx].screenshotUrl = result.secure_url;
    payments[idx].updatedAt = new Date().toISOString();

    await savePayments(payments);
    res.json({ success: true, screenshotUrl: payments[idx].screenshotUrl });
  } catch (err) {
    console.error('Upload proof error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload proof' });
  }
});

// Upload proof by phone (used by current Firestore UI)
app.post('/api/viewer/proofs/upload', upload.single('screenshot'), async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ error: 'phone is required' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'screenshot is required' });

    const payments = await readPayments();

    const pending = payments
      .filter(p => p.phone === phone && p.status === 'pending')
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    if (!pending.length) return res.status(404).json({ error: 'No pending payment for this phone' });

    const target = pending[0];
    const idx = payments.findIndex(p => p.id === target.id);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'aime-christian-momo-proofs',
          public_id: `payment-${target.id}-${phone}-${Date.now()}`,
          overwrite: true
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      ).end(file.buffer);
    });

    payments[idx].screenshotUrl = result.secure_url;
    payments[idx].updatedAt = new Date().toISOString();

    await savePayments(payments);

    res.json({
      success: true,
      secureUrl: payments[idx].screenshotUrl,
      screenshotUrl: payments[idx].screenshotUrl
    });
  } catch (err) {
    console.error('Upload proof (viewer) error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload proof' });
  }
});

// Admin list payments
app.get('/api/payments', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const payments = await readPayments();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list payments' });
  }
});

// Admin confirm payment
app.post('/api/payments/confirm', express.json(), async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { paymentId } = req.body || {};
    const id = String(paymentId || '');
    if (!id) return res.status(400).json({ error: 'paymentId is required' });

    const payments = await readPayments();
    const idx = payments.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });

    payments[idx].status = 'confirmed';
    payments[idx].confirmedAt = new Date().toISOString();
    payments[idx].updatedAt = new Date().toISOString();

    if (!payments[idx].expiresAt) {
      payments[idx].expiresAt = computeExpiresAtFromPlan(payments[idx].planType);
    }

    await savePayments(payments);
    res.json({ success: true });
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ error: err.message || 'Failed to confirm payment' });
  }
});

// Viewer login + access (phone + password)
app.post('/api/viewer/login', express.json(), async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    const p = normalizePhone(phone);
    const pass = String(password || '');

    if (!p || p.length < 9) return res.status(400).json({ error: 'Valid phone number is required' });
    if (!pass) return res.status(400).json({ error: 'Password is required' });

    const payments = await readPayments();

    const active = payments.find(
      (pay) => pay.phone === p && pay.status === 'confirmed' && String(pay.momoPassword || '') === pass && isPaymentActive(pay)
    );

    if (!active) {
      const pending = payments.find(pay => pay.phone === p && pay.status === 'pending');
      if (pending) return res.status(403).json({ success: false, reason: 'pending' });
      return res.status(403).json({ success: false, reason: 'go_pay' });
    }

    res.cookie('viewer', JSON.stringify({ phone: active.phone }), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ success: true, expiresAt: active.expiresAt || null });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Viewer login failed' });
  }
});

function getViewerFromCookie(req) {
  const raw = req.cookies.viewer;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.phone) return { phone: normalizePhone(parsed.phone) };
  } catch {
    // ignore
  }
  return null;
}

// Viewer me
app.get('/api/viewer/me', async (req, res) => {
  try {
    const viewer = getViewerFromCookie(req);
    if (!viewer) return res.json({ loggedIn: false, hasAccess: false });

    const payments = await readPayments();
    const confirmed = payments
      .filter(p => p.phone === viewer.phone && p.status === 'confirmed')
      .find(p => isPaymentActive(p));

    if (!confirmed) return res.json({ loggedIn: true, hasAccess: false, reason: 'expired_or_not_approved' });

    res.json({
      loggedIn: true,
      hasAccess: true,
      access: {
        phone: confirmed.phone,
        fullName: confirmed.fullName,
        planType: confirmed.planType,
        amount: confirmed.amount,
        expiresAt: confirmed.expiresAt || null,
        documentaryIds: confirmed.documentaryIds
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get viewer status' });
  }
});

// Backward-compatible endpoint
app.get('/api/me/access', async (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone);
    if (!phone) return res.json({ hasAccess: false });

    const payments = await readPayments();
    const confirmed = payments.find(p => p.phone === phone && isPaymentActive(p));
    if (!confirmed) return res.json({ hasAccess: false });

    res.json({
      hasAccess: true,
      access: {
        phone: confirmed.phone,
        fullName: confirmed.fullName,
        planType: confirmed.planType,
        amount: confirmed.amount,
        expiresAt: confirmed.expiresAt || null,
        documentaryIds: confirmed.documentaryIds
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get access' });
  }
});

// Upload Endpoint (Admin)
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

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          public_id: sanitizedTitle,
          folder: 'aime-christian-documentaries',
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
      title,
      summary: summary || '',
      url: result.secure_url,
      uploadedAt: new Date().toISOString()
    };

    await saveDocumentary(metadata);
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Upload Error:', error);
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
    console.error('Save Error:', err);
    throw err;
  }
}

app.listen(APP_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${APP_PORT}`);
});

