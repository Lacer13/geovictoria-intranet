import { connectAuthEmulator, getAuth } from "firebase/auth";
import { app, isLocalDemo } from "./firebase";

// Authentication loads only when the administrative route is opened.
export const auth = getAuth(app);
auth.languageCode = "es";
if (isLocalDemo)
  connectAuthEmulator(
    auth,
    `http://127.0.0.1:${Number(import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099)}`,
    { disableWarnings: true },
  );
