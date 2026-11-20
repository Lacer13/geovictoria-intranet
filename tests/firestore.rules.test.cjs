const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
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
  query,
  where,
  orderBy,
  limit,
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
  await env.clearFirestore();
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

const greeting = () => ({
  recipient: "Equipo",
  authorName: "Ana",
  isAnonymous: false,
  message: "Gracias por acompañarnos este año.",
  visible: true,
  createdAt: serverTimestamp(),
});
const wallPath = "christmasWalls/2026/greetings";
test("wall accepts signed and anonymous greetings but rejects hidden identity, invalid text and forged dates", async () => {
  const visitor = env.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(visitor, wallPath, "signed"), greeting()));
  await assertSucceeds(
    setDoc(doc(visitor, wallPath, "anonymous"), {
      ...greeting(),
      isAnonymous: true,
      authorName: "Anónimo",
    }),
  );
  for (const [id, fields] of Object.entries({
    identity: { isAnonymous: true },
    extra: { email: "private@example.test" },
    blank: { message: " \n\t " },
    oversized: { message: "x".repeat(1001) },
    shortName: { authorName: "A" },
    multilineName: { authorName: "Ana\nOtra" },
    blankName: { authorName: "  " },
    multilineRecipient: { recipient: "Equipo\nPersona" },
    hidden: { visible: false },
    date: { createdAt: new Date("2020-01-01") },
  }))
    await assertFails(
      setDoc(doc(visitor, wallPath, id), { ...greeting(), ...fields }),
    );
});
test("only administrators can hide or restore a greeting; hidden messages cannot be read by visitors", async () => {
  const visitor = env.unauthenticatedContext().firestore(),
    admin = env.authenticatedContext("wall-admin", { admin: true }).firestore();
  const post = doc(visitor, wallPath, "moderation"),
    adminPost = doc(admin, wallPath, "moderation");
  await assertSucceeds(setDoc(post, greeting()));
  await assertFails(
    updateDoc(post, { visible: false, moderatedAt: serverTimestamp() }),
  );
  await assertFails(updateDoc(post, { authorName: "Otra persona" }));
  await assertFails(deleteDoc(post));
  await assertSucceeds(
    updateDoc(adminPost, { visible: false, moderatedAt: serverTimestamp() }),
  );
  await assertFails(getDoc(post));
  await assertFails(getDocs(collection(visitor, wallPath)));
  const visible = await assertSucceeds(
    getDocs(
      query(
        collection(visitor, wallPath),
        where("visible", "==", true),
        orderBy("createdAt", "desc"),
        limit(30),
      ),
    ),
  );
  assert.ok(!visible.docs.some((d) => d.id === "moderation"));
  await assertSucceeds(getDoc(adminPost));
  await assertSucceeds(
    getDocs(
      query(
        collection(admin, wallPath),
        orderBy("createdAt", "desc"),
        limit(30),
      ),
    ),
  );
  await assertFails(updateDoc(adminPost, { message: "Texto cambiado" }));
  await assertSucceeds(
    updateDoc(adminPost, { visible: true, moderatedAt: serverTimestamp() }),
  );
  await assertSucceeds(getDoc(post));
  await assertFails(deleteDoc(adminPost));
});

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

const { writeBatch } = sdkRequire("firebase/firestore");
const santaAdmin = () =>
  env
    .authenticatedContext("santa-organizer", {
      admin: true,
      email: "organizer@example.test",
      email_verified: true,
    })
    .firestore();
let santaToken = 1000;
function santaDraftData(count = 3) {
  const ids = Array.from({ length: count }, (_, i) =>
    (i + 1).toString(16).padStart(32, "0"),
  );
  return {
    title: "Intercambio de prueba",
    exchangeDate: "2026-12-24",
    budget: "S/ 50",
    notes: "Solo en emulador",
    participantIds: ids,
    people: Object.fromEntries(
      ids.map((id, i) => [
        id,
        { name: `Persona ${i + 1}`, email: `santa${i + 1}@example.test` },
      ]),
    ),
    assignments: {},
    status: "draft",
    revision: 0,
    createdBy: "santa-organizer",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
function santaDrawBatch(
  db,
  id,
  event,
  { invalid = false, extraField = false } = {},
) {
  const assignments = Object.fromEntries(
    event.participantIds.map((giver, i) => [
      giver,
      {
        recipientId:
          event.participantIds[(i + 1) % event.participantIds.length],
        cardId: (santaToken++).toString(16).padStart(64, "0"),
      },
    ]),
  );
  const batch = writeBatch(db);
  batch.update(doc(db, "secretSantaEvents", id), {
    assignments,
    status: "drawn",
    revision: 1,
    drawnAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  for (const [index, giver] of event.participantIds.entries()) {
    const pair = assignments[giver];
    const card = {
      eventId: id,
      giverId: giver,
      giverName: event.people[giver].name,
      recipientId: pair.recipientId,
      recipientName: event.people[pair.recipientId].name,
      title: event.title,
      exchangeDate: event.exchangeDate,
      budget: event.budget,
      notes: event.notes,
      createdAt: serverTimestamp(),
    };
    if (invalid && index === 0) card.recipientId = giver;
    if (extraField && index === 0) card.recipientEmail = "private@example.test";
    batch.set(doc(db, "secretSantaCards", pair.cardId), card);
  }
  return { batch, assignments };
}
let publicSantaId;
let publicSantaPairs;
let publicSantaPeople;
test("only administrators can create and read Santa rosters or email settings", async () => {
  const admin = santaAdmin(),
    visitor = env.unauthenticatedContext().firestore();
  const event = santaDraftData();
  await assertFails(
    setDoc(doc(visitor, "secretSantaEvents", "public-attempt"), event),
  );
  await assertSucceeds(
    setDoc(doc(admin, "secretSantaEvents", "saved-roster"), event),
  );
  await assertFails(getDoc(doc(visitor, "secretSantaEvents", "saved-roster")));
  await assertFails(getDocs(collection(visitor, "secretSantaEvents")));
  const settings = {
    enabled: true,
    serviceId: "service_demo",
    templateId: "template_demo",
    publicKey: "public_demo",
    updatedBy: "santa-organizer",
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(
    setDoc(doc(admin, "portalSettings", "secretSantaEmail"), settings),
  );
  await assertFails(getDoc(doc(visitor, "portalSettings", "secretSantaEmail")));
  await assertFails(
    setDoc(doc(admin, "portalSettings", "secretSantaEmail"), {
      ...settings,
      smtpPassword: "must-not-be-stored",
    }),
  );
});
test("draft saves require a new revision and at most 100 unique participant IDs", async () => {
  const admin = santaAdmin();
  await assertFails(
    updateDoc(doc(admin, "secretSantaEvents", "saved-roster"), {
      title: "Stale change",
      revision: 0,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(admin, "secretSantaEvents", "saved-roster"), {
      title: "Updated title",
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(
      doc(admin, "secretSantaEvents", "too-many-people"),
      santaDraftData(101),
    ),
  );
  const duplicate = santaDraftData(2);
  duplicate.participantIds.push(duplicate.participantIds[0]);
  await assertFails(
    setDoc(doc(admin, "secretSantaEvents", "duplicate-ids"), duplicate),
  );
});
test("a malformed card rejects the whole draw without publishing partial results", async () => {
  const admin = santaAdmin();
  const event = santaDraftData();
  await assertSucceeds(
    setDoc(doc(admin, "secretSantaEvents", "invalid-draw"), event),
  );
  const { batch, assignments } = santaDrawBatch(admin, "invalid-draw", event, {
    invalid: true,
  });
  await assertFails(batch.commit());
  const retained = await getDoc(
    doc(admin, "secretSantaEvents", "invalid-draw"),
  );
  assert.equal(retained.data().status, "draft");
  for (const pair of Object.values(assignments))
    assert.equal(
      (await getDoc(doc(admin, "secretSantaCards", pair.cardId))).exists(),
      false,
    );
});
test("public cards cannot include participant email addresses", async () => {
  const admin = santaAdmin();
  const event = santaDraftData();
  await setDoc(doc(admin, "secretSantaEvents", "no-email-leak"), event);
  const { batch } = santaDrawBatch(admin, "no-email-leak", event, {
    extraField: true,
  });
  await assertFails(batch.commit());
});
test("a complete atomic draw exposes only a private card, never a roster or list of cards", async () => {
  const admin = santaAdmin();
  const visitor = env.unauthenticatedContext().firestore();
  const event = santaDraftData();
  publicSantaId = "complete-draw";
  publicSantaPeople = event;
  await setDoc(doc(admin, "secretSantaEvents", publicSantaId), event);
  const { batch, assignments } = santaDrawBatch(admin, publicSantaId, event);
  publicSantaPairs = assignments;
  await assertSucceeds(batch.commit());
  const first = event.participantIds[0];
  const card = await assertSucceeds(
    getDoc(doc(visitor, "secretSantaCards", assignments[first].cardId)),
  );
  assert.equal(
    card.data().recipientName,
    event.people[assignments[first].recipientId].name,
  );
  assert.equal("recipientEmail" in card.data(), false);
  await assertFails(getDocs(collection(visitor, "secretSantaCards")));
  await assertFails(getDocs(collection(admin, "secretSantaCards")));
  await assertFails(getDoc(doc(visitor, "secretSantaEvents", publicSantaId)));
  await assertFails(
    getDoc(doc(visitor, "secretSantaCards", "guessable-short-id")),
  );
});
test("drawn rosters, pairings and cards are immutable even for administrators", async () => {
  const admin = santaAdmin();
  const ref = doc(admin, "secretSantaEvents", publicSantaId);
  await assertFails(
    updateDoc(ref, {
      title: "Changed after sending",
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(ref, {
      status: "draft",
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(ref, {
      assignments: {},
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  );
  const card = doc(
    admin,
    "secretSantaCards",
    Object.values(publicSantaPairs)[0].cardId,
  );
  await assertFails(updateDoc(card, { recipientName: "Changed result" }));
  await assertFails(deleteDoc(card));
  await assertFails(deleteDoc(ref));
});
test("archiving disables private links and restoring retains the same result", async () => {
  const admin = santaAdmin();
  const visitor = env.unauthenticatedContext().firestore();
  const ref = doc(admin, "secretSantaEvents", publicSantaId);
  const token = Object.values(publicSantaPairs)[0].cardId;
  const before = (await getDoc(doc(visitor, "secretSantaCards", token))).data();
  await assertSucceeds(
    updateDoc(ref, {
      status: "archived",
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(doc(visitor, "secretSantaCards", token)));
  await assertSucceeds(
    updateDoc(ref, {
      status: "drawn",
      revision: 3,
      updatedAt: serverTimestamp(),
    }),
  );
  assert.deepEqual(
    (await getDoc(doc(visitor, "secretSantaCards", token))).data(),
    before,
  );
});
test("email attempts require an exclusive sending state and cannot overwrite active attempts", async () => {
  const admin = santaAdmin();
  const giver = publicSantaPeople.participantIds[0];
  const ref = doc(
    admin,
    "secretSantaEvents",
    publicSantaId,
    "deliveries",
    giver,
  );
  const attempt = {
    state: "sending",
    attemptId: "a".repeat(32),
    attempts: 1,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    provider: "emailjs",
    lastError: "",
  };
  await assertFails(setDoc(ref, { ...attempt, state: "accepted" }));
  await assertSucceeds(setDoc(ref, attempt));
  await assertFails(
    setDoc(ref, { ...attempt, attemptId: "b".repeat(32), attempts: 2 }),
  );
  await assertSucceeds(
    updateDoc(ref, { state: "accepted", updatedAt: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(ref, {
      lastError: "Changed receipt",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    setDoc(ref, { ...attempt, attemptId: "c".repeat(32), attempts: 2 }),
  );
  await assertSucceeds(
    updateDoc(ref, {
      state: "uncertain",
      lastError: "Network result unknown",
      updatedAt: serverTimestamp(),
    }),
  );
  const visitor = env.unauthenticatedContext().firestore();
  await assertFails(
    getDoc(
      doc(visitor, "secretSantaEvents", publicSantaId, "deliveries", giver),
    ),
  );
  await assertFails(
    setDoc(
      doc(
        admin,
        "secretSantaEvents",
        publicSantaId,
        "deliveries",
        "not-a-participant",
      ),
      attempt,
    ),
  );
});
test("the maximum group can be stored atomically within Firestore rule access limits", async () => {
  const admin = santaAdmin();
  const event = santaDraftData(100);
  await assertSucceeds(
    setDoc(doc(admin, "secretSantaEvents", "large-draw"), event),
  );
  const { batch } = santaDrawBatch(admin, "large-draw", event);
  await assertSucceeds(batch.commit());
  assert.equal(
    Object.keys(
      (await getDoc(doc(admin, "secretSantaEvents", "large-draw"))).data()
        .assignments,
    ).length,
    100,
  );
});

test("editing published content keeps authorization checks and field constraints", async () => {
  const admin = env
    .authenticatedContext("content-editor", { admin: true })
    .firestore();
  const visitor = env.unauthenticatedContext().firestore();
  const ref = doc(admin, "news", "editable-content");
  await assertSucceeds(setDoc(ref, news));
  await assertSucceeds(
    updateDoc(ref, { title: "Título corregido", desc: "Contenido corregido" }),
  );
  assert.equal((await getDoc(ref)).data().timestamp, news.timestamp);
  await assertFails(
    updateDoc(doc(visitor, "news", "editable-content"), {
      title: "No autorizado",
    }),
  );
  await assertFails(updateDoc(ref, { title: "" }));
  await assertFails(updateDoc(ref, { internalSecret: "must-not-be-public" }));
  const contact = doc(admin, "directory", "editable-contact");
  await setDoc(contact, {
    name: "Nombre",
    department: "Área",
    email: "valid@example.test",
    color: "#135e40",
  });
  await assertSucceeds(
    updateDoc(contact, { name: "Nombre corregido", email: "new@example.test" }),
  );
  await assertFails(
    updateDoc(doc(visitor, "directory", "editable-contact"), {
      name: "Intruso",
    }),
  );
  await assertFails(updateDoc(contact, { email: "invalid" }));
});
