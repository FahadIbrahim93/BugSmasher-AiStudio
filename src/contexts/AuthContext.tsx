import { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'

interface UserProfile {
  uid: string
  username: string
  email: string | null
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: () => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid)
          const userDoc = await getDoc(userRef)

          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: user.uid,
              username: user.displayName || 'Anonymous User',
              email: user.email,
              updatedAt: new Date().toISOString()
            }
            await setDoc(userRef, newProfile)
            setProfile(newProfile)
          } else {
            setProfile(userDoc.data() as UserProfile)
          }
        } catch (_e) {
          setProfile({
            uid: user.uid,
            username: user.displayName || 'Anonymous User',
            email: user.email || null,
            updatedAt: new Date().toISOString()
          })
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  const signInFn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (_e) {
      console.error('Login failed')
    }
  }

  const logOutFn = async () => {
    try {
      await signOut(auth)
    } catch (_e) {
      console.error('Logout failed')
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn: signInFn, logOut: logOutFn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
