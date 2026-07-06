import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
// SECURITY FIX (audit): Do not import firebase-applet-config.json directly.
// Use VITE_ env vars (see .env.example). Add firebase-applet-config.json to .gitignore.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Add other fields from the json as needed (messagingSenderId, etc.)
};

export const app = initializeApp(firebaseConfig);

let db: any; // Firestore instance, typed loosely for multi-db init
try {
  // Initialize with robust persistent local cache for multi-tab environments and connect to the correct database instance
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, (import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined));
} catch (e: unknown) {
  console.warn('Failed to initialize Firestore with persistent multi-tab cache, falling back to default:', e);
  db = getFirestore(app, (import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined));
}

export { db };
export const functions = getFunctions(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// SECURITY: Only request minimal OIDC scopes required for auth/profile.
// Broad Drive/Gmail/Docs/Sheets/Calendar access removed — previous scopes created
// unacceptable data-access attack surface for a game. Workspace sync features
// (if re-enabled) must use incremental consent or separate dedicated flows.


// Test Connection
async function testConnection() {
  try {
    // Wrap with a race-promise to prevent long-hanging operations on load
    const testPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => { reject(new Error('connection timeout')); }, 2500));
    
    await Promise.race([testPromise, timeoutPromise]);
  } catch (error: unknown) {
    console.warn("Firestore connection check: operating in offline mode.", error instanceof Error ? error.message : error);
  }
}
void testConnection();

export { signInWithPopup, signOut };
