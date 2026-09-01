import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firebaseApp: App | null = null;
let db: Firestore | null = null;

function getFirebaseApp(): App {
  if (firebaseApp) return firebaseApp;

  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = apps[0];
    return firebaseApp;
  }

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!credentialsJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON is not set');
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    firebaseApp = initializeApp({
      credential: cert(credentials),
    });
  } catch {
    throw new Error('Failed to parse Firebase credentials');
  }

  return firebaseApp;
}

export function getDb(): Firestore {
  if (db) return db;
  
  const app = getFirebaseApp();
  db = getFirestore(app);
  return db;
}

// Collection references
export const collections = {
  users: 'users',
  documentaries: 'documentaries',
  payments: 'payments',
  admins: 'admins',
} as const;