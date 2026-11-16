const { before, after, test } = require("node:test");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const sdkRequire = createRequire(
  require.resolve("@firebase/rules-unit-testing"),
);
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} = sdkRequire("firebase/firestore");

let env;
before(async () => {
  // Deliberately refuses production: only a local emulator is allowed.
  if (!process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error("Start the Firestore emulator before running rules tests.");
  env = await initializeTestEnvironment({
    projectId: "demo-geovictoria",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
after(async () => {
  await env?.cleanup();
});
const feedback = () => ({
  name: "Anónimo",
  department: "",
  isAnonymous: true,
  message: "Mensaje de prueba del emulador",
  date: new Date().toISOString(),
  createdAt: serverTimestamp(),
});
const news = {
  title: "Comunicado de prueba",
  desc: "Solo en el emulador",
  type: "anuncio",
  date: "16 nov",
  timestamp: "2026-11-16T12:00:00Z",
};

test("anonymous visitors can submit a valid report but cannot read the inbox", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(db, "feedbacks", "anonymous"), feedback()));
  await assertFails(getDoc(doc(db, "feedbacks", "anonymous")));
  await assertFails(getDocs(collection(db, "feedbacks")));
});
test("reports cannot claim anonymity while including a name or area", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(
    setDoc(doc(db, "feedbacks", "misleading"), {
      ...feedback(),
      name: "Persona",
    }),
  );
  await assertFails(
    setDoc(doc(db, "feedbacks", "misleading-area"), {
      ...feedback(),
      department: "IT",
    }),
  );
  await assertFails(
    setDoc(doc(db, "feedbacks", "oversize"), {
      ...feedback(),
      message: "x".repeat(5001),
    }),
  );
  await assertFails(
    setDoc(doc(db, "feedbacks", "extra-field"), { ...feedback(), admin: true }),
  );
});
test("an ordinary authenticated user cannot read reports or publish news", async () => {
  const db = env.authenticatedContext("employee").firestore();
  await assertFails(getDocs(collection(db, "feedbacks")));
  await assertFails(setDoc(doc(db, "news", "unauthorized"), news));
  await assertFails(
    setDoc(doc(db, "directory", "unauthorized"), {
      name: "Test",
      department: "IT",
      email: "test@example.test",
      color: "#123456",
    }),
  );
});
test("admin claim permits publication, contact management and report review", async () => {
  const db = env.authenticatedContext("admin", { admin: true }).firestore();
  await assertSucceeds(setDoc(doc(db, "news", "valid"), news));
  await assertSucceeds(
    setDoc(doc(db, "directory", "valid"), {
      name: "Test",
      department: "IT",
      email: "test@example.test",
      color: "#123456",
    }),
  );
  await assertSucceeds(getDocs(collection(db, "feedbacks")));
  await assertSucceeds(deleteDoc(doc(db, "directory", "valid")));
});
test("public resources remain readable, but reports cannot be edited", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDocs(collection(db, "news")));
  await assertSucceeds(getDocs(collection(db, "directory")));
  await assertSucceeds(getDocs(collection(db, "leaderboard")));
  await assertFails(
    updateDoc(doc(db, "feedbacks", "anonymous"), { message: "Cambio" }),
  );
  await assertFails(deleteDoc(doc(db, "feedbacks", "anonymous")));
});
test("ranking accepts bounded scores and rejects hidden fields or edits", async () => {
  const db = env.unauthenticatedContext().firestore();
  const score = { name: "Prueba", score: 100, date: "2026-11-16T12:00:00Z" };
  await assertSucceeds(setDoc(doc(db, "leaderboard", "valid"), score));
  await assertFails(
    setDoc(doc(db, "leaderboard", "negative"), { ...score, score: -1 }),
  );
  await assertFails(
    setDoc(doc(db, "leaderboard", "infinite"), { ...score, score: 10000001 }),
  );
  await assertFails(
    setDoc(doc(db, "leaderboard", "extra"), { ...score, admin: true }),
  );
  await assertFails(updateDoc(doc(db, "leaderboard", "valid"), { score: 999 }));
});
test("unknown collections deny every read and write", async () => {
  const db = env.authenticatedContext("admin", { admin: true }).firestore();
  await assertFails(setDoc(doc(db, "private", "unknown"), { test: true }));
  await assertFails(getDoc(doc(db, "private", "unknown")));
});
