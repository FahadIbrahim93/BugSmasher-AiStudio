import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  projectId: 'studio-1155838266-56095',
  appId: '1:911343381703:web:75c16ea460d4aeab2ca2e2',
  apiKey: 'AIzaSyAgszp_gKNxJCUs0BWa42pArAzyHSuzDqw',
  authDomain: 'studio-1155838266-56095.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-bbad97a8-130e-497c-b106-9e804ac0d82d',
  storageBucket: 'studio-1155838266-56095.firebasestorage.app',
  messagingSenderId: '911343381703',
  measurementId: ''
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId)
export const googleProvider = new GoogleAuthProvider()
export { signInWithPopup, signOut }
