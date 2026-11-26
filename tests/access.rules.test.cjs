const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const sdkRequire = createRequire(
  require.resolve("@firebase/rules-unit-testing"),
);
const {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} = sdkRequire("firebase/firestore");
let env, owner;
const email = (name) => `${name}@example.test`;
const user = (name, claims = {}) =>
  env
    .authenticatedContext(name, {
      email: email(name),
      email_verified: true,
      ...claims,
    })
    .firestore();
const profile = (permissions, extra = {}) => ({
  name: "Perfil de prueba",
  description: "Solo emulador",
  permissions,
  active: true,
  revision: 0,
  createdBy: "root",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...extra,
});
const member = (name, profileId, extra = {}) => ({
  email: email(name),
  role: "admin",
  active: true,
  profileId,
  createdBy: "root",
  createdAt: serverTimestamp(),
  ...extra,
});
const news = {
  title: "Publicación",
  desc: "Contenido",
  type: "anuncio",
  date: "25 nov",
  timestamp: "2026-11-25T12:00:00Z",
};
async function provision(name, permissions, options = {}) {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "accessProfiles", name), profile(permissions));
    await setDoc(doc(db, "administrators", email(name)), member(name, name));
  });
  return user(name, options);
}
before(async () => {
  if (!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || ""))
    throw Error("Only a local Firestore emulator is allowed");
  env = await initializeTestEnvironment({
    projectId: "demo-geovictoria",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
  await env.clearFirestore();
  owner = env
    .authenticatedContext("root", {
      admin: true,
      email: email("root"),
      email_verified: true,
    })
    .firestore();
});
after(async () => env?.cleanup());

test("only authorized access managers can create valid custom profiles", async () => {
  const visitor = env.unauthenticatedContext().firestore();
  await assertFails(
    setDoc(doc(visitor, "accessProfiles", "forged"), profile(["news.edit"])),
  );
  await assertSucceeds(
    setDoc(
      doc(owner, "accessProfiles", "valid"),
      profile(["news.create", "news.edit"]),
    ),
  );
  for (const [id, permissions] of [
    ["empty", []],
    ["unknown", ["owner"]],
    ["duplicate", ["news.edit", "news.edit"]],
    ["missing-view", ["santa.manage"]],
    ["reports-dependency", ["reports.delete"]],
  ])
    await assertFails(
      setDoc(doc(owner, "accessProfiles", id), profile(permissions)),
    );
  await assertFails(
    setDoc(
      doc(owner, "accessProfiles", "extra"),
      profile(["news.edit"], { hiddenOwner: true }),
    ),
  );
  await assertFails(deleteDoc(doc(owner, "accessProfiles", "valid")));
});

test("editors can edit their content but cannot create, delete or access other private modules", async () => {
  const editor = await provision("editor", ["news.edit"]);
  await setDoc(doc(owner, "news", "editable"), news);
  await assertSucceeds(
    updateDoc(doc(editor, "news", "editable"), { desc: "Edición autorizada" }),
  );
  await assertFails(setDoc(doc(editor, "news", "new"), news));
  await assertFails(deleteDoc(doc(editor, "news", "editable")));
  await assertFails(getDocs(collection(editor, "feedbacks")));
  await assertFails(getDocs(collection(editor, "secretSantaEvents")));
  await assertFails(getDocs(collection(editor, "quizEvents")));
  await assertFails(getDocs(collection(editor, "administrators")));
  await assertFails(getDocs(collection(editor, "accessProfiles")));
  await assertSucceeds(getDoc(doc(editor, "accessProfiles", "editor")));
  await assertFails(getDoc(doc(editor, "accessProfiles", "valid")));
});

test("report readers cannot delete or grant themselves a different profile", async () => {
  const reader = await provision("reader", ["reports.view"]);
  await env.withSecurityRulesDisabled(async (context) =>
    setDoc(doc(context.firestore(), "feedbacks", "private"), {
      message: "Privado",
    }),
  );
  await assertSucceeds(getDoc(doc(reader, "feedbacks", "private")));
  await assertFails(deleteDoc(doc(reader, "feedbacks", "private")));
  await assertFails(
    updateDoc(doc(reader, "administrators", email("reader")), {
      profileId: "valid",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(reader, "accessProfiles", "reader"), {
      permissions: ["reports.view", "access.manage"],
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
});

test("limited access managers cannot grant permissions beyond their own or edit their assigned profile", async () => {
  const manager = await provision("manager", ["access.manage", "news.edit"]);
  await assertSucceeds(
    setDoc(
      doc(manager, "accessProfiles", "managed-editor"),
      profile(["news.edit"], { createdBy: "manager" }),
    ),
  );
  await assertFails(
    setDoc(
      doc(manager, "accessProfiles", "overpowered"),
      profile(["news.delete"], { createdBy: "manager" }),
    ),
  );
  await assertFails(
    updateDoc(doc(manager, "accessProfiles", "manager"), {
      name: "Mi propio cambio",
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    setDoc(
      doc(manager, "administrators", email("invited")),
      member("invited", "managed-editor", { createdBy: "manager" }),
    ),
  );
  await assertFails(
    setDoc(
      doc(manager, "administrators", email("escalated")),
      member("escalated", "valid", { createdBy: "manager" }),
    ),
  );
  const legacy = member("legacy-escalated", "valid", { createdBy: "manager" });
  delete legacy.profileId;
  await assertFails(
    setDoc(doc(manager, "administrators", email("legacy-escalated")), legacy),
  );
  await assertFails(
    updateDoc(doc(manager, "administrators", email("manager")), {
      profileId: "managed-editor",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(manager, "accessProfiles", "valid"), {
      permissions: ["news.edit"],
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
});

test("explicit restricted memberships and revocations override an older admin claim", async () => {
  const claimed = await provision("claimed", ["reports.view"], { admin: true });
  await assertSucceeds(getDocs(collection(claimed, "feedbacks")));
  await assertFails(setDoc(doc(claimed, "news", "claim-bypass"), news));
  await updateDoc(doc(owner, "administrators", email("claimed")), {
    active: false,
    updatedAt: serverTimestamp(),
  });
  await assertFails(getDocs(collection(claimed, "feedbacks")));
  await assertFails(
    setDoc(
      doc(claimed, "accessProfiles", "claim-root"),
      profile(["access.manage"]),
    ),
  );
});

test("editing, disabling and reassigning profiles changes subsequent protected requests without token refresh", async () => {
  const scoped = await provision("dynamic", ["news.edit"]);
  await assertSucceeds(
    updateDoc(doc(scoped, "news", "editable"), { desc: "Antes del cambio" }),
  );
  await assertSucceeds(
    updateDoc(doc(owner, "accessProfiles", "dynamic"), {
      permissions: ["reports.view"],
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(scoped, "news", "editable"), {
      desc: "No autorizado después del cambio",
    }),
  );
  await assertSucceeds(getDocs(collection(scoped, "feedbacks")));
  await assertFails(
    updateDoc(doc(owner, "accessProfiles", "dynamic"), {
      active: false,
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(owner, "accessProfiles", "dynamic"), {
      active: false,
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(getDocs(collection(scoped, "feedbacks")));
  await assertSucceeds(
    updateDoc(doc(owner, "administrators", email("dynamic")), {
      profileId: "valid",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(scoped, "news", "editable"), {
      desc: "Nuevo perfil habilitado",
    }),
  );
});

test("the principal account, own membership and membership roles cannot be demoted or forged", async () => {
  await env.withSecurityRulesDisabled(async (context) =>
    setDoc(
      doc(context.firestore(), "administrators", email("principal")),
      member("principal", "valid", { role: "owner" }),
    ),
  );
  await assertFails(
    updateDoc(doc(owner, "administrators", email("principal")), {
      active: false,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(
      doc(owner, "administrators", email("newowner")),
      member("newowner", "valid", { role: "owner" }),
    ),
  );
  await assertFails(
    setDoc(
      doc(owner, "administrators", email("root")),
      member("root", "valid"),
    ),
  );
  await assertFails(deleteDoc(doc(owner, "administrators", email("editor"))));
});

test("missing profiles deny access instead of inheriting full administration", async () => {
  await env.withSecurityRulesDisabled(async (context) =>
    setDoc(
      doc(context.firestore(), "administrators", email("missing")),
      member("missing", "missing-profile"),
    ),
  );
  await assertFails(getDocs(collection(user("missing"), "feedbacks")));
  await assertFails(
    setDoc(
      doc(user("missing", { admin: true }), "news", "missing-profile-bypass"),
      news,
    ),
  );
  await assertFails(
    getDocs(collection(user("reader", { email_verified: false }), "feedbacks")),
  );
});

test("private Santa consultation does not authorize drawing, archiving or email settings", async () => {
  const viewer = await provision("santa-viewer", ["santa.view"]);
  const id = "private-draft";
  const event = {
    title: "Consulta",
    exchangeDate: "",
    budget: "",
    notes: "",
    people: {},
    participantIds: [],
    assignments: {},
    status: "draft",
    revision: 0,
    createdBy: "root",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(owner, "secretSantaEvents", id), event);
  await assertSucceeds(getDoc(doc(viewer, "secretSantaEvents", id)));
  await assertFails(
    setDoc(doc(viewer, "secretSantaEvents", "forged"), {
      ...event,
      createdBy: "santa-viewer",
    }),
  );
  await assertFails(
    updateDoc(doc(viewer, "secretSantaEvents", id), {
      title: "Cambio no autorizado",
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(doc(viewer, "portalSettings", "secretSantaEmail")));
  await assertFails(
    setDoc(doc(viewer, "portalSettings", "secretSantaEmail"), {
      enabled: false,
      serviceId: "",
      templateId: "",
      publicKey: "",
      updatedBy: "santa-viewer",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("a restricted profile can store the largest quiz draft within the expression budget", async () => {
  const host = await provision("profile-host", ["quiz.manage"]);
  const questions = Array.from({ length: 10 }, (_, index) => ({
    prompt: `Pregunta ${index}`,
    options: ["A", "B", "C", "D", "E"],
    correctIndex: 4,
    seconds: 30,
  }));
  await assertSucceeds(
    setDoc(doc(host, "quizEvents", "PRFL2345"), {
      title: "Concurso por perfil",
      questions,
      status: "draft",
      revision: 0,
      createdBy: "profile-host",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(host, "quizEvents", "PRFL2345"), {
      questions: questions.map((question) => ({ ...question, seconds: 45 })),
      revision: 1,
      updatedAt: serverTimestamp(),
    }),
  );
  assert.equal(
    (await getDoc(doc(host, "quizEvents", "PRFL2345"))).data().questions.length,
    10,
  );
});

test("creation, editing, deletion, moderation and score permissions remain independent", async () => {
  const creator = await provision("creator", ["news.create"]);
  await assertSucceeds(setDoc(doc(creator, "news", "created-only"), news));
  await assertFails(
    updateDoc(doc(creator, "news", "created-only"), {
      desc: "No puede editar",
    }),
  );
  await assertFails(deleteDoc(doc(creator, "news", "created-only")));
  const directoryEditor = await provision("directory-editor", [
    "directory.edit",
  ]);
  const contact = {
    department: "Equipo",
    name: "Ana",
    email: "ana@example.test",
    color: "#135e40",
  };
  await setDoc(doc(owner, "directory", "contact"), contact);
  await assertSucceeds(
    updateDoc(doc(directoryEditor, "directory", "contact"), {
      name: "Ana de prueba",
    }),
  );
  await assertFails(
    setDoc(doc(directoryEditor, "directory", "forged-contact"), contact),
  );
  await assertFails(deleteDoc(doc(directoryEditor, "directory", "contact")));
  const deleter = await provision("directory-deleter", ["directory.delete"]);
  await assertSucceeds(deleteDoc(doc(deleter, "directory", "contact")));
  const moderator = await provision("moderator", ["wall.moderate"]);
  await env.withSecurityRulesDisabled(async (context) =>
    setDoc(
      doc(context.firestore(), "christmasWalls", "2026", "greetings", "hidden"),
      {
        recipient: "Equipo",
        authorName: "Ana",
        isAnonymous: false,
        message: "Prueba de moderación",
        visible: false,
        createdAt: serverTimestamp(),
      },
    ),
  );
  await assertSucceeds(
    getDocs(collection(moderator, "christmasWalls", "2026", "greetings")),
  );
  await assertFails(
    getDoc(doc(creator, "christmasWalls", "2026", "greetings", "hidden")),
  );
  await assertSucceeds(
    updateDoc(doc(moderator, "christmasWalls", "2026", "greetings", "hidden"), {
      visible: true,
      moderatedAt: serverTimestamp(),
    }),
  );
  const scoreManager = await provision("score-manager", ["scores.manage"]);
  await setDoc(doc(owner, "leaderboard", "score"), {
    name: "Prueba",
    score: 10,
    date: "2026-11-25",
  });
  await assertFails(deleteDoc(doc(creator, "leaderboard", "score")));
  await assertSucceeds(deleteDoc(doc(scoreManager, "leaderboard", "score")));
});

test("a scoped Santa manager can commit one hundred invitations within document access limits", async () => {
  const organizer = await provision("large-santa", [
    "santa.view",
    "santa.manage",
  ]);
  const ids = Array.from({ length: 100 }, (_, index) =>
    (index + 1).toString(16).padStart(32, "0"),
  );
  const eventRef = doc(organizer, "secretSantaEvents", "scoped-large-draw");
  const people = Object.fromEntries(
    ids.map((id, index) => [
      id,
      { name: `Persona ${index}`, email: `p${index}@example.test` },
    ]),
  );
  const event = {
    title: "Sorteo por perfil",
    exchangeDate: "",
    budget: "",
    notes: "",
    participantIds: ids,
    people,
    assignments: {},
    status: "draft",
    revision: 0,
    createdBy: "large-santa",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(eventRef, event));
  const assignments = Object.fromEntries(
    ids.map((id, index) => [
      id,
      {
        recipientId: ids[(index + 1) % 100],
        cardId: (100000 + index).toString(16).padStart(64, "0"),
      },
    ]),
  );
  const batch = writeBatch(organizer);
  batch.update(eventRef, {
    assignments,
    status: "drawn",
    revision: 1,
    drawnAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  for (const id of ids) {
    const pair = assignments[id];
    batch.set(doc(organizer, "secretSantaCards", pair.cardId), {
      eventId: eventRef.id,
      giverId: id,
      giverName: people[id].name,
      recipientId: pair.recipientId,
      recipientName: people[pair.recipientId].name,
      title: event.title,
      exchangeDate: "",
      budget: "",
      notes: "",
      createdAt: serverTimestamp(),
    });
  }
  await assertSucceeds(batch.commit());
  assert.equal((await getDoc(eventRef)).data().status, "drawn");
  await assertFails(
    getDoc(doc(organizer, "portalSettings", "secretSantaEmail")),
  );
  const mailer = await provision("mailer", ["santa.view", "santa.mail"]);
  await assertSucceeds(
    setDoc(doc(mailer, "portalSettings", "secretSantaEmail"), {
      enabled: true,
      serviceId: "service_demo",
      templateId: "template_demo",
      publicKey: "public_demo",
      updatedBy: "mailer",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    setDoc(
      doc(mailer, "secretSantaEvents", eventRef.id, "deliveries", ids[0]),
      {
        state: "sending",
        attemptId: "f".repeat(32),
        attempts: 1,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        provider: "demo",
        lastError: "",
      },
    ),
  );
  await assertFails(
    updateDoc(doc(mailer, "secretSantaEvents", eventRef.id), {
      status: "archived",
      revision: 2,
      updatedAt: serverTimestamp(),
    }),
  );
});

test("an administrator without Santa permissions cannot read the roster or pairs or grant that access", async () => {
  const permissions = ['reports.view', 'reports.delete', 'news.create', 'news.edit', 'news.delete', 'directory.create', 'directory.edit', 'directory.delete', 'quiz.manage', 'wall.moderate', 'scores.manage', 'access.manage'];
  const restricted = await provision('no-santa', permissions, { admin: true });
  await assertSucceeds(getDocs(collection(restricted, 'feedbacks')));
  await assertSucceeds(getDocs(collection(restricted, 'administrators')));
  await assertFails(getDocs(collection(restricted, 'secretSantaEvents')));
  await assertFails(getDoc(doc(restricted, 'secretSantaEvents', 'scoped-large-draw')));
  await assertFails(getDocs(collection(restricted, 'secretSantaCards')));
  await assertFails(getDocs(collection(restricted, 'secretSantaEvents', 'scoped-large-draw', 'deliveries')));
  await assertFails(getDoc(doc(restricted, 'portalSettings', 'secretSantaEmail')));
  await assertFails(setDoc(doc(restricted, 'accessProfiles', 'santa-escalation'), profile(['santa.view'], { createdBy: 'no-santa' })));
  await assertFails(updateDoc(doc(restricted, 'accessProfiles', 'no-santa'), { permissions: [...permissions, 'santa.view'], revision: 1, updatedAt: serverTimestamp() }));
});

test("the compact quiz timer check keeps every integer from ten to ninety and rejects other types", async () => {
  const host = user("profile-host");
  const ref = doc(host, "quizEvents", "TMRX2345");
  const question = {
    prompt: "Tiempo válido",
    options: ["A", "B"],
    correctIndex: 0,
    seconds: 10,
  };
  await assertSucceeds(
    setDoc(ref, {
      title: "Tiempos",
      questions: [question],
      status: "draft",
      revision: 0,
      createdBy: "profile-host",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  let revision = 0;
  for (let seconds = 10; seconds <= 90; seconds++)
    await assertSucceeds(
      updateDoc(ref, {
        questions: [{ ...question, seconds }],
        revision: ++revision,
        updatedAt: serverTimestamp(),
      }),
    );
  for (const seconds of [0, 9, 91, 100, -30, 30.5, "30", true])
    await assertFails(
      updateDoc(ref, {
        questions: [{ ...question, seconds }],
        revision: revision + 1,
        updatedAt: serverTimestamp(),
      }),
    );
});
