import { getAuth } from "firebase/auth";
import { app } from "./firebase";

// Authentication loads only when the administrative route is opened.
export const auth = getAuth(app);
