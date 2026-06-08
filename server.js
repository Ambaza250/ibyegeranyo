// server.js - FULL UPDATED VERSION (May 2026)
import express from 'express';
import fs from 'fs';
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

// Use disk storage so large videos don't need to fit into RAM.
// This prevents crashes/timeouts on big uploads.
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'tmp-uploads')),
    filename: (req, file, cb) => {
      const safeName = String(file.originalname || 'upload')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 180);
      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: {
    // Keep upload size high; Cloudinary handles large video streaming.
    fileSize: 1024 * 1024 * 1024 // 1GB
  }
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

// Prefer Vercel/prod env var if present, but always fall back to local serviceAccountKey.json
// so /api/documentaries works in local/dev.
const envServiceAccount = getFirebaseServiceAccountFromEnv();

function loadLocalServiceAccountFileSync() {
  try {
    const localPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (!fs.existsSync(localPath)) return null;
    const raw = fs.readFileSync(localPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const localServiceAccount = loadLocalServiceAccountFileSync();
const cred = envServiceAccount || localServiceAccount;

const firebaseAdmin = initializeApp({
  projectId: 'ibyegeranyo-6e49b',
  ...(cred ? { credential: cert(cred) } : {})
});

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}




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

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean).map(value => String(value)))];
}

function phoneCandidates(phone) {
  const normalized = normalizePhone(phone);
  return uniqueValues([
    normalized,
    normalized.startsWith('250') ? normalized.slice(3) : null,
    normalized.startsWith('0') ? `250${normalized.slice(1)}` : null,
    normalized.length === 9 ? `0${normalized}` : null,
    normalized.length === 9 ? `250${normalized}` : null
  ]);
}

function pickUserPayment(data = {}) {
  return data.payment || data.subscription || data.account || data;
}

function hasConfirmedStatus(data = {}, payment = {}) {
  const values = [
    payment.status,
    payment.paymentStatus,
    data.status,
    data.accountStatus,
    data.subscriptionStatus
  ].map(value => String(value || '').toLowerCase());

  return values.some(value => ['confirmed', 'active', 'approved', 'verified', 'paid'].includes(value))
    || payment.confirmed === true
    || data.confirmed === true
    || payment.isConfirmed === true
    || data.isConfirmed === true;
}

function getExpiryValue(data = {}, payment = {}) {
  return payment.expiresAt
    || payment.endDate
    || payment.expiryDate
    || payment.expirationDate
    || data.expiresAt
    || data.endDate
    || data.expiryDate
    || data.expirationDate;
}

function matchesAccessPassword(data = {}, payment = {}, password) {
  if (password === undefined || password === null || String(password).length === 0) return true;
  const expectedValues = [
    payment.momoPassword,
    payment.password,
    payment.accountPassword,
    data.momoPassword,
    data.password,
    data.accountPassword
  ].filter(value => value !== undefined && value !== null);

  return expectedValues.some(value => String(value) === String(password));
}

async function findUserByPhone(phone) {
  for (const candidate of phoneCandidates(phone)) {
    const snap = await db.collection('users').doc(candidate).get();
    if (snap.exists) {
      return { id: snap.id, data: snap.data() || {} };
    }
  }

  for (const candidate of phoneCandidates(phone)) {
    const snap = await db.collection('users').where('phone', '==', candidate).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, data: doc.data() || {} };
    }
  }

  return null;
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
  // IMPORTANT: This route must always return documentaries for the main page.
  // If Firestore is not available (e.g., local credentials issues), we fall back
  // to the local database file: documentaries/data.json.

  // 1) Try Firestore (best-effort)
  try {
    const snapshot = await withTimeout(
      db.collection('documentaries').get(),
      5000,
      'Firestore documentaries query timed out'
    );

    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => {
      const aTime = Date.parse(a.uploadedAt || a.createdAt || 0);
      const bTime = Date.parse(b.uploadedAt || b.createdAt || 0);
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

    res.json(docs);
    return;
  } catch (error) {
    // Fall through to local file
    console.error('Error fetching documentaries from Firestore:', error);
  }

  // 2) Fallback to local file (source of truth for the library rendering)
  try {
    const localPath = path.join(process.cwd(), 'documentaries', 'data.json');
    const raw = await fsp.readFile(localPath, 'utf8');
    const parsed = JSON.parse(raw);

    // Support both shapes: [] OR { documentaries: [] }
    const docs = Array.isArray(parsed)
      ? parsed
      : (parsed?.documentaries || []);

    res.json(Array.isArray(docs) ? docs : []);
  } catch (e) {
    console.error('Error fetching documentaries from local file:', e);
    res.status(200).json([]);
  }
});

// ====================== DOCUMENTARIES UPLOAD: Blob → Cloudinary → Firestore ======================
// IMPORTANT: These endpoints keep large video bytes out of the Express request body.
// Client uploads the raw video to Vercel Blob, then calls this backend endpoint with blobUrl.

// NOTE: This implementation uses Vercel Blob presigned upload URLs.
// It requires VERCEL_BLOB_READ_WRITE_TOKEN to be set in the environment.
// If you don't have that yet, uploads will fail at the init step.

// Since Vercel Blob presigned-upload URL generation can vary by @vercel/blob versions,
// and because your immediate goal is to fix payload-too-big uploads, we’ll implement the
// simplest compatible flow:
// 1) Browser uploads to Blob directly using the @vercel/blob client.
// 2) Browser returns the blobUrl to the server.
//
// Therefore, blob-upload-init is intentionally removed to avoid a broken/partial implementation.
// (If you still want init-based presigning, add it after we confirm your @vercel/blob version/API.)
app.post('/api/documentaries/blob-upload-init', (req, res) => {
  res.status(501).json({
    error: 'Not implemented in this build: your @vercel/blob version does not expose getSignedUrl() in the browser/server runtime. Use server-side /api/documentaries/upload-from-blob with a valid blobUrl generated by @vercel/blob put().'
  });
});


app.post('/api/documentaries/upload-from-blob', express.json(), async (req, res) => {
  try {
    if (req.cookies.admin !== 'true') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, summary, blobUrl } = req.body || {};
    if (!title || !blobUrl) {
      return res.status(400).json({ error: 'Title and blobUrl are required' });
    }

    const sanitizedTitle = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const publicId = `documentaries/${sanitizedTitle}-${Date.now()}`;

    const resp = await fetch(blobUrl);
    if (!resp.ok) {
      return res.status(400).json({ error: `Failed to fetch blobUrl (${resp.status})` });
    }
    if (!resp.body) {
      return res.status(400).json({ error: 'blobUrl did not return a readable stream' });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = resp.body;
      cloudinary.uploader.upload_stream({
        resource_type: 'video',
        public_id: publicId,
        folder: 'aime-christian-documentaries',
        chunk_size: 6000000
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(stream);
    });

    const docData = {
      title: String(title).trim(),
      summary: String(summary || '').trim(),
      cloudinaryUrl: uploadResult.secure_url,
      thumbnail: uploadResult.thumbnail_url || null,
      duration: 'HD',
      uploadedAt: new Date().toISOString()
    };

    const docRef = await db.collection('documentaries').add(docData);

    res.json({ success: true, id: docRef.id, documentary: docData });
  } catch (error) {
    console.error('Upload-from-blob error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Backward-compatible endpoint (small uploads only). Keep it but don’t use it for big videos.
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

    // If this is large, admins should use /api/documentaries/upload-from-blob.
    if (file.size && file.size > 50 * 1024 * 1024) {
      return res.status(413).json({
        error: 'Payload too large for server upload. Use Blob staging + /api/documentaries/upload-from-blob.'
      });
    }

    const sanitizedTitle = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
      title: String(title).trim(),
      summary: String(summary || '').trim(),
      cloudinaryUrl: uploadResult.secure_url,
      thumbnail: uploadResult.thumbnail_url || null,
      duration: 'HD',
      uploadedAt: new Date().toISOString()
    };

    const docRef = await db.collection('documentaries').add(docData);

    res.json({ success: true, id: docRef.id, documentary: docData });
  } catch (error) {
    console.error('Upload documentary error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Upload Trailer for an existing documentary → Cloudinary + update Firestore
app.post('/api/documentaries/:id/trailer', upload.single('trailer'), async (req, res) => {
  try {
    if (req.cookies.admin !== 'true') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const documentaryId = req.params.id;
    const file = req.file;

    if (!documentaryId) {
      return res.status(400).json({ error: 'Documentary id is required' });
    }
    if (!file) {
      return res.status(400).json({ error: 'Trailer video file is required' });
    }

    // Get documentary title (for nicer Cloudinary naming)
    let docTitle = 'documentary';
    try {
      const snap = await db.collection('documentaries').doc(documentaryId).get();
      if (snap.exists) {
        const d = snap.data() || {};
        if (d.title) docTitle = String(d.title);
      }
    } catch {
      // best-effort only
    }

    const sanitizedTitle = docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const publicId = `documentaries-trailers/${sanitizedTitle}-${documentaryId}-${Date.now()}`;

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: 'video',
        public_id: publicId,
        folder: 'aime-christian-documentaries-trailers',
        chunk_size: 6000000
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(file.buffer);
    });

    const trailerUrl = uploadResult.secure_url;

    await db.collection('documentaries').doc(documentaryId).set(
      {
        trailerUrl,
        trailerThumbnail: uploadResult.thumbnail_url || null,
        trailerUploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    res.json({ success: true, trailerUrl });
  } catch (error) {
    console.error('Upload trailer error:', error);
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

    const user = await findUserByPhone(phone);
    if (!user) {
      return res.json({ hasAccess: false, reason: 'NO_ACCOUNT' });
    }

    const data = user.data || {};
    const payment = pickUserPayment(data);
    if (!payment) {
      return res.json({ hasAccess: false, reason: 'NO_PAYMENT' });
    }

    if (!hasConfirmedStatus(data, payment)) {
      return res.json({ hasAccess: false, reason: 'NOT_CONFIRMED' });
    }

    const expiresAtRaw = getExpiryValue(data, payment);
    if (expiresAtRaw) {
      const expiresAt = new Date(expiresAtRaw).getTime();
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        return res.json({ hasAccess: false, reason: 'NOT_ACTIVE' });
      }
    }

    if (!matchesAccessPassword(data, payment, password)) {
      return res.json({ hasAccess: false, reason: 'BAD_PASSWORD' });
    }

    return res.json({ hasAccess: true, phone: user.id });
  } catch (e) {
    console.error('me/access error:', e);
    res.json({ hasAccess: false });
  }
});



app.listen(APP_PORT, () => {
  console.log(`🚀 Server running on port ${APP_PORT}`);
});
