import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface UserProfile {
  uid: string;
  username: string;
  email: string | null;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !db) {
      // Firebase not configured (offline build) — skip auth entirely.
      setLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user);
      if (user) {
        // Profile sync runs async; loading stays true until it settles so the
        // UI never shows "loaded" with a missing profile (original ordering).
        void (async () => {
          try {
            // Sync profile
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              const newProfile: UserProfile = {
                uid: user.uid,
                username: user.displayName || 'Anonymous User',
                email: user.email,
                updatedAt: new Date().toISOString()
              };
              await setDoc(userRef, newProfile);
              setProfile(newProfile);
            } else {
              setProfile(userDoc.data() as UserProfile);
            }
          } catch (error: unknown) {
            console.warn("Offline or failed to sync user profile from Firestore:", error);
            // High-reliability fallback: use auth details to build local profile state
            setProfile({
              uid: user.uid,
              username: user.displayName || 'Anonymous User',
              email: user.email || null,
              updatedAt: new Date().toISOString()
            });
          }
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setAccessToken(null);
        setLoading(false);
      }
    });

    return () => { unsubscribeAuth(); };
  }, []);

  // Listen for profile changes
  useEffect(() => {
    if (!user || !db) return;
    let unsubscribe: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const startListener = () => {
      try {
        unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshotDoc) => {
          if (snapshotDoc.exists()) {
            setProfile(snapshotDoc.data() as UserProfile);
          }
        }, (error) => {
          const isPermissionError = error?.message?.includes("permissions") || error?.code === "permission-denied";
          
          if (isPermissionError && attempt < 5) {
            attempt++;
            const delay = attempt * 1000;
            console.warn(`Profile listener permission denied, retrying in ${delay}ms (attempt ${attempt}/5)...`);
            if (unsubscribe) {
              unsubscribe();
            }
            timeoutId = setTimeout(startListener, delay);
            return;
          }
          
          console.error("Profile listen error:", error);
          // S-08: PII-free error payload — no uid, email, or verification state.
          const errInfo = {
            error: error instanceof Error ? error.message : String(error),
            operationType: 'get',
            path: 'users/<uid>',
            authInfo: {
              authenticated: Boolean(auth?.currentUser),
            }
          };
          console.error('Firestore Error: ', JSON.stringify(errInfo));
        });
      } catch (e: unknown) {
        console.error("Synchronous error starting profile listener:", e);
      }
    };

    startListener();

    return () => {
      if (unsubscribe) unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  const signIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setAccessToken(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logOut, accessToken, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
