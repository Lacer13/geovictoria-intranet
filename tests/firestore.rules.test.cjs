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

const delegatedEmail = "delegado@example.test";
const anotherEmail = "otro@example.test";
const membership = (email) => ({
  email,
  role: "admin",
  active: true,
  createdBy: "root-owner",
  createdAt: serverTimestamp(),
});
test("a verified invited administrator receives permissions without custom claims", async () => {
  const root = env
    .authenticatedContext("root-owner", {
      admin: true,
      email: "owner@example.test",
      email_verified: true,
    })
    .firestore();
  await assertSucceeds(
    setDoc(
      doc(root, "administrators", delegatedEmail),
      membership(delegatedEmail),
    ),
  );
  const delegated = env
    .authenticatedContext("delegated", {
      email: delegatedEmail,
      email_verified: true,
    })
    .firestore();
  await assertSucceeds(getDocs(collection(delegated, "feedbacks")));
  await assertSucceeds(setDoc(doc(delegated, "news", "delegated-news"), news));
});
test("an unverified email or uninvited account cannot become an administrator", async () => {
  const unverified = env
    .authenticatedContext("unverified", {
      email: delegatedEmail,
      email_verified: false,
    })
    .firestore();
  const outsider = env
    .authenticatedContext("outsider", {
      email: "outsider@example.test",
      email_verified: true,
    })
    .firestore();
  await assertFails(getDocs(collection(unverified, "feedbacks")));
  await assertFails(getDoc(doc(unverified, "administrators", delegatedEmail)));
  await assertFails(getDocs(collection(outsider, "feedbacks")));
  await assertFails(
    setDoc(doc(outsider, "administrators", "outsider@example.test"), {
      ...membership("outsider@example.test"),
      createdBy: "outsider",
    }),
  );
});
test("delegated administrators can invite others but cannot assign owner privileges", async () => {
  const delegated = env
    .authenticatedContext("delegated", {
      email: delegatedEmail,
      email_verified: true,
    })
    .firestore();
  await assertSucceeds(
    setDoc(doc(delegated, "administrators", anotherEmail), {
      ...membership(anotherEmail),
      createdBy: "delegated",
    }),
  );
  await assertFails(
    setDoc(doc(delegated, "administrators", "newowner@example.test"), {
      ...membership("newowner@example.test"),
      createdBy: "delegated",
      role: "owner",
    }),
  );
  await assertFails(
    updateDoc(doc(delegated, "administrators", anotherEmail), {
      role: "owner",
      updatedAt: serverTimestamp(),
    }),
  );
});
test("the principal account and an administrators own access are protected", async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "administrators", "owner@example.test"),
      { ...membership("owner@example.test"), role: "owner" },
    );
  });
  const delegated = env
    .authenticatedContext("delegated", {
      email: delegatedEmail,
      email_verified: true,
    })
    .firestore();
  await assertFails(
    updateDoc(doc(delegated, "administrators", "owner@example.test"), {
      active: false,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(delegated, "administrators", delegatedEmail), {
      active: false,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(deleteDoc(doc(delegated, "administrators", anotherEmail)));
});
test("revoking membership denies subsequent protected requests and is reversible", async () => {
  const delegated = env
    .authenticatedContext("delegated", {
      email: delegatedEmail,
      email_verified: true,
    })
    .firestore();
  const other = env
    .authenticatedContext("other", {
      email: anotherEmail,
      email_verified: true,
    })
    .firestore();
  await assertSucceeds(getDocs(collection(other, "feedbacks")));
  await assertSucceeds(
    updateDoc(doc(delegated, "administrators", anotherEmail), {
      active: false,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(getDocs(collection(other, "feedbacks")));
  await assertFails(setDoc(doc(other, "news", "revoked-news"), news));
  await assertSucceeds(
    updateDoc(doc(delegated, "administrators", anotherEmail), {
      active: true,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(getDocs(collection(other, "feedbacks")));
});
