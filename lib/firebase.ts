import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

console.log("Firebase Config (public keys):", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
})

if (!firebaseConfig.projectId) {
  console.error("Firebase projectId is missing! Check .env.local file")
}

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)

console.log("Firebase initialized successfully")

export { app, db, auth }
