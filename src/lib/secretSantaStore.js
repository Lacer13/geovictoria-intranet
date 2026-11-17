import {
  collection,
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth } from "../auth";
import { db, isLocalDemo } from "../firebase";
import {
  createAssignmentPlan,
  emailTemplateParams,
  normalizeRoster,
  randomHex,
  validMailSettings,
} from "./secretSanta";
import { MailRequestError, requestSantaEmail } from "./secretSantaEmail";

export async function saveSantaDraft(eventId, form, rows, expectedRevision) {
  const roster = normalizeRoster(rows);
  const title = form.title.trim();
  if (!title || title.length > 100)
    throw new Error("Indica un nombre de hasta 100 caracteres para el sorteo.");
  const ref = eventId
    ? doc(db, "secretSantaEvents", eventId)
    : doc(collection(db, "secretSantaEvents"));
  const revision = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (
      snapshot.exists() &&
      (snapshot.data().status !== "draft" ||
        snapshot.data().revision !== expectedRevision)
    )
      throw new Error(
        "Otra persona modificó este sorteo. Recarga su versión guardada antes de continuar.",
      );
    const next = snapshot.exists() ? snapshot.data().revision + 1 : 0;
    const data = {
      ...roster,
      title,
      exchangeDate: form.exchangeDate || "",
      budget: form.budget.trim().slice(0, 100),
      notes: form.notes.trim().slice(0, 1000),
      revision: next,
      updatedAt: serverTimestamp(),
    };
    if (snapshot.exists()) transaction.update(ref, data);
    else
      transaction.set(ref, {
        ...data,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        status: "draft",
        assignments: {},
      });
    return next;
  });
  return { id: ref.id, revision };
}

export async function drawSanta(eventId, expectedRevision) {
  const ref = doc(db, "secretSantaEvents", eventId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("El sorteo ya no está disponible.");
    const event = snapshot.data();
    if (event.status !== "draft")
      throw new Error(
        "Este sorteo ya tiene resultados guardados. No se generaron nuevas parejas.",
      );
    if (event.revision !== expectedRevision)
      throw new Error(
        "La lista cambió. Revisa la versión guardada antes de sortear.",
      );
    normalizeRoster(
      event.participantIds.map((id) => ({ id, ...event.people[id] })),
      true,
    );
    const assignments = createAssignmentPlan(event.participantIds);
    transaction.update(ref, {
      status: "drawn",
      assignments,
      drawnAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      revision: event.revision + 1,
    });
    for (const id of event.participantIds) {
      const pair = assignments[id];
      transaction.set(doc(db, "secretSantaCards", pair.cardId), {
        eventId,
        giverId: id,
        giverName: event.people[id].name,
        recipientId: pair.recipientId,
        recipientName: event.people[pair.recipientId].name,
        title: event.title,
        exchangeDate: event.exchangeDate,
        budget: event.budget,
        notes: event.notes,
        createdAt: serverTimestamp(),
      });
    }
  });
}

export async function archiveSanta(eventId, archived) {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, "secretSantaEvents", eventId);
    const snapshot = await transaction.get(ref);
    if (
      !snapshot.exists() ||
      !["drawn", "archived"].includes(snapshot.data().status)
    )
      throw new Error(
        "Solo puedes archivar o restaurar un sorteo ya realizado.",
      );
    transaction.update(ref, {
      status: archived ? "archived" : "drawn",
      updatedAt: serverTimestamp(),
      revision: snapshot.data().revision + 1,
    });
  });
}

export async function sendSantaEmail(eventId, giverId, { force = false } = {}) {
  const attemptId = randomHex(16);
  const eventRef = doc(db, "secretSantaEvents", eventId);
  const deliveryRef = doc(eventRef, "deliveries", giverId);
  const settingsRef = doc(db, "portalSettings", "secretSantaEmail");
  const saved = await runTransaction(db, async (transaction) => {
    const [eventSnapshot, deliverySnapshot, config] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(deliveryRef),
      transaction.get(settingsRef),
    ]);
    const event = eventSnapshot.data();
    const old = deliverySnapshot.data();
    const settings = config.data();
    if (!event || event.status !== "drawn" || !event.assignments[giverId])
      throw new Error("Este sorteo no está disponible para enviar correos.");
    if (!validMailSettings(settings))
      throw new Error("Primero conecta EmailJS desde Configurar correo.");
    if (old?.state === "accepted" && !force) return { skipped: true };
    if (
      old?.state === "sending" &&
      Date.now() - (old.startedAt?.toMillis?.() || Date.now()) < 90000
    )
      throw new Error(
        "Ya hay un envío en curso para esta persona. Espera antes de reintentar.",
      );
    if (["sending", "uncertain"].includes(old?.state) && !force)
      throw new Error(
        "Este envío requiere revisar el historial de EmailJS antes de reintentar.",
      );
    transaction.set(deliveryRef, {
      state: "sending",
      attemptId,
      attempts: (old?.attempts || 0) + 1,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      provider: isLocalDemo ? "demo" : "emailjs",
      lastError: "",
    });
    return { event, settings };
  });
  if (saved.skipped) return { skipped: true };
  let result;
  try {
    result = isLocalDemo
      ? { state: "accepted", provider: "demo" }
      : await requestSantaEmail(
          saved.settings,
          emailTemplateParams(saved.event, giverId, window.location.origin),
        );
  } catch (error) {
    await completeAttempt(deliveryRef, attemptId, {
      state: error.uncertain ? "uncertain" : "failed",
      lastError: error.message,
    });
    throw error;
  }
  try {
    await completeAttempt(deliveryRef, attemptId, { ...result, lastError: "" });
  } catch {
    throw new MailRequestError(
      "El servicio aceptó el correo, pero no pudimos guardar la confirmación. Revisa el historial antes de reenviar.",
      { uncertain: true, stopBatch: true },
    );
  }
  return result;
}

async function completeAttempt(ref, attemptId, update) {
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(ref);
    if (current.data()?.attemptId !== attemptId)
      throw new Error(
        "El estado del envío cambió. Recarga antes de continuar.",
      );
    transaction.update(ref, { ...update, updatedAt: serverTimestamp() });
  });
}

export async function saveSantaEmailSettings(settings) {
  const data = {
    enabled: settings.enabled === true,
    serviceId: settings.serviceId.trim(),
    templateId: settings.templateId.trim(),
    publicKey: settings.publicKey.trim(),
  };
  if (data.enabled && !validMailSettings(data))
    throw new Error("Completa los tres identificadores públicos de EmailJS.");
  await setDoc(doc(db, "portalSettings", "secretSantaEmail"), {
    ...data,
    updatedBy: auth.currentUser.uid,
    updatedAt: serverTimestamp(),
  });
}

export async function getSantaCard(token) {
  const snapshot = await getDocFromServer(doc(db, "secretSantaCards", token));
  if (!snapshot.exists()) throw new Error("Enlace no disponible.");
  return snapshot.data();
}
