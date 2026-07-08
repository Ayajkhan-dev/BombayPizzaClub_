// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging"; // NEW: Firebase Cloud Messaging
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "bombaypizza-154bf.firebaseapp.com",
  projectId: "bombaypizza-154bf",
  storageBucket: "bombaypizza-154bf.firebasestorage.app",
  messagingSenderId: "750717628048",
  appId: "1:750717628048:web:26a1a75471b119f9f77215"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app)

// ===== NEW: Firebase Cloud Messaging (FCM) =====
// FIXED: previously this used isSupported().then(...) which is async and
// created a race condition - useNotifications.jsx would run BEFORE the
// promise resolved, so `messaging` was always still null.
let messaging = null
try {
  messaging = getMessaging(app)
} catch (error) {
  console.log("FCM not supported in this browser", error)
}
// ===== END NEW =====

export {app,auth,messaging}