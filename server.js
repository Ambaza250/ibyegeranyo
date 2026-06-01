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
// IMPORTANT: In local/dev environments, firebase-admin must be initialized with
// service account credentials (otherwise Google ADC lookup fails).
//
// Option A (recommended for Vercel): set GOOGLE_APPLICATION_CREDENTIALS_JSON to the full
// service account JSON string.
function getFirebaseServiceAccountFromEnv() {
  const jsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!jsonString) {
    return null;
  }
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

import { cert } from 'firebase-admin/app';

const serviceAccount = getFirebaseServiceAccountFromEnv();

const firebaseAdmin = initializeApp({
  projectId: 'ibyegeranyo-6e49b',
  // firebase-admin requires a valid credential object in local/dev.
  // If GOOGLE_APPLICATION_CREDENTIALS_JSON is missing or invalid, we fail fast so you can fix env.
  credential: serviceAccount ? cert(serviceAccount) : (() => {
    throw new Error('Missing/invalid GOOGLE_APPLICATION_CREDENTIALS_JSON (service account JSON string)');
  })()
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

  // Pricing rules:
  // - monthly: 200 RWF / month (expires ~ 30 days)
  // - single: 2000 RWF / 1 documentary (expires ~ 30 days)
  // - weekly/yearly tiers kept for backward compatibility
  // - In case you still send other tier values, fall back to ~30 days.
  if (p === 'weekly') return new Date(now + 7 * msDay).toISOString();
  if (p === 'yearly') return new Date(now + 365 * msDay).toISOString();
  return new Date(now + 30 * msDay).toISOString(); // monthly/single default
}

function isPaymentActive(payment) {
  if (!payment || payment.status !== 'confirmed') return false;
  if (!payment.expiresAt) return true;
  return new Date(payment.expiresAt).getTime() > Date.now();
}

function doesPasswordMatch(payment, password) {
  if (!payment) return false;
  if (!password) return false;
  // Payment record stores momoPassword; for login we treat it as the password.
  return String(payment.momoPassword) === String(password);
}


// ====================== ROUTES ======================
app.get('/', (req, res) => res.sendFile(path.resolve(process.cwd(), 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.resolve(process.cwd(), 'admin.html')));
app.get('/player.html', (req, res) => res.sendFile(path.resolve(process.cwd(), 'player.html')));


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

    const paymentId = Date.now().toString();
    const expiresAt = computeExpiresAtFromPlan(planType);

    const record = {
      id: paymentId,
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
      expiresAt
    };

    // 1) Local payments.json (existing behavior)
    const payments = await readPayments();
    payments.unshift(record);
    await savePayments(payments);

    // 2) Firestore users/{phone} document (NEW)
    const nowIso = new Date().toISOString();
    const userDocRef = db.collection('users').doc(normalizedPhone);

    const userPayment = {
      paymentId,
      fullName: record.fullName,
      momoPassword: record.momoPassword,
      planType: record.planType,
      amount: record.amount,
      documentaryIds: [],
      endDate: null,
      expiresAt: record.expiresAt,
      startDate: null,
      status: 'pending',
      // Cloudinary proof link (screenshots)
      screenshotUrl: record.screenshotUrl || null,
      // Also duplicate at top-level for easier admin rendering (if needed)
      proofCloudinaryUrl: record.screenshotUrl || null,
      updatedAt: nowIso
    };

    await userDocRef.set(
      {
        phone: normalizedPhone,
        fullName: record.fullName,
        updatedAt: nowIso,
        payment: userPayment
      },
      { merge: true }
    );

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
    payment.proofCloudinaryUrl = result.secure_url;
    payment.updatedAt = new Date().toISOString();

    // Keep Firestore users/{phone} screenshot link in sync immediately after upload
    // so admin can see the proof before/without requiring confirm.
    const userSnap = await db.collection('users').where('payment.paymentId', '==', paymentId).limit(1).get();
    if (!userSnap.empty) {
      const docId = userSnap.docs[0].id;
      await db.collection('users').doc(docId).set(
        {
          updatedAt: new Date().toISOString(),
          payment: {
            screenshotUrl: result.secure_url,
            proofCloudinaryUrl: result.secure_url,
            updatedAt: new Date().toISOString()
          }
        },
        { merge: true }
      );
    }

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
    // Update local file (existing behavior)
    payment.status = 'confirmed';
    payment.confirmedAt = new Date().toISOString();
    await savePayments(payments);

    // Update Firestore users/{phone} doc (NEW)
    const normalizedPhone = normalizePhone(payment.phone);
    const nowIso = new Date().toISOString();

    await db.collection('users').doc(normalizedPhone).set(
      {
        updatedAt: nowIso,
        // Keep a top-level duplicate as well (helps admin UIs)
        payment: {
          ...(typeof payment.expiresAt !== 'undefined' ? { expiresAt: payment.expiresAt } : {}),
          status: 'confirmed',
          confirmedAt: nowIso,
          paymentId: paymentId,
          momoPassword: payment.momoPassword,
          planType: payment.planType,
          amount: payment.amount,
          fullName: payment.fullName,
          // Cloudinary proof link (screenshots)
          screenshotUrl: payment.screenshotUrl || null,
          proofCloudinaryUrl: payment.screenshotUrl || null,
          documentaryIds: [],
          endDate: payment.endDate || null,
          startDate: payment.startDate || null,
          updatedAt: nowIso
        }
      },
      { merge: true }
    );

    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Payment not found' });
  }
});

// ====================== DOCUMENTARIES (Firestore) ======================
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
      // Required fields for library display
      title: title.trim(),
      summary: (summary || '').trim(),
      cloudinaryUrl: uploadResult.secure_url,

      // Extra fields kept for UI/Admin convenience
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

// Check user access (login gate)
// IMPORTANT: login verification reads from Firestore `users/{phone}.payment`.
// Admin flows/upload-proof still use local payments.json as usual.
app.get('/api/me/access', async (req, res) => {
  try {
    const { phone, password } = req.query;
    if (!phone) return res.json({ hasAccess: false });

    const normalizedPhone = normalizePhone(phone);
    const userSnap = await db.collection('users').doc(normalizedPhone).get();
    if (!userSnap.exists) {
      return res.json({ hasAccess: false, reason: 'NO_ACCOUNT' });
    }

    const data = userSnap.data() || {};
    const payment = data.payment || data.subscription || null;
    if (!payment) {
      return res.json({ hasAccess: false, reason: 'NO_PAYMENT' });
    }

    // Metrics from your verified firestore structure:
    // status must be confirmed, expiry must be in the future
    const status = String(payment.status || '').toLowerCase();
    if (status !== 'confirmed') {
      return res.json({ hasAccess: false, reason: 'NOT_CONFIRMED' });
    }

    const expiresAtRaw = payment.expiresAt || payment.endDate;
    if (!expiresAtRaw) {
      return res.json({ hasAccess: false, reason: 'NO_EXPIRES' });
    }

    const expiresAt = new Date(expiresAtRaw).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return res.json({ hasAccess: false, reason: 'NOT_ACTIVE' });
    }

    // Password match only when password is provided (login passes it)
    if (password !== undefined && password !== null && String(password).length > 0) {
      if (String(payment.momoPassword) !== String(password)) {
        return res.json({ hasAccess: false, reason: 'BAD_PASSWORD' });
      }
    }

    return res.json({ hasAccess: true });
  } catch (e) {
    console.error('me/access error:', e);
    res.json({ hasAccess: false });
  }
});



app.listen(APP_PORT, () => {
  console.log(`🚀 Server running on port ${APP_PORT}`);
});
