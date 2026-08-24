import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_Xzq7b7Gr-wvHyb52DoNNYnQjDRpaomM",
  authDomain: "geovictoria-intranet-peru.firebaseapp.com",
  projectId: "geovictoria-intranet-peru",
  storageBucket: "geovictoria-intranet-peru.firebasestorage.app",
  messagingSenderId: "306325710647",
  appId: "1:306325710647:web:eb54e5795d8904087c1cb2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
