import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// Test mode is removed from production builds and never points at live data.
const isLocalDemo =
  import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

const firebaseConfig = {
  apiKey: "AIzaSyB_Xzq7b7Gr-wvHyb52DoNNYnQjDRpaomM",
  authDomain: "geovictoria-intranet-peru.firebaseapp.com",
  projectId: "geovictoria-intranet-peru",
  storageBucket: "geovictoria-intranet-peru.firebasestorage.app",
  messagingSenderId: "306325710647",
  appId: "1:306325710647:web:eb54e5795d8904087c1cb2",
};

const app = initializeApp(
  isLocalDemo
    ? {
        ...firebaseConfig,
        apiKey: "demo-api-key",
        projectId: "demo-geovictoria",
        authDomain: "demo-geovictoria.firebaseapp.com",
      }
    : firebaseConfig,
);
const db = getFirestore(app);
if (isLocalDemo)
  connectFirestoreEmulator(
    db,
    "127.0.0.1",
    Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8188),
  );

export { app, db, isLocalDemo };
