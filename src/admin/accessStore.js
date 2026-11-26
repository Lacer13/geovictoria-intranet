import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../auth";
import { db } from "../firebase";
import { normalizeProfile } from "./permissions";

export async function saveProfile(profile, expected) {
  const payload = normalizeProfile(profile);
  const ref = expected
    ? doc(db, "accessProfiles", expected.id)
    : doc(collection(db, "accessProfiles"));
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (
      expected &&
      (!snapshot.exists() || snapshot.data().revision !== expected.revision)
    )
      throw Error(
        "Otra persona modificó este perfil. Cierra y vuelve a abrir su versión actual.",
      );
    if (snapshot.exists())
      transaction.update(ref, {
        ...payload,
        revision: snapshot.data().revision + 1,
        updatedAt: serverTimestamp(),
      });
    else
      transaction.set(ref, {
        ...payload,
        revision: 0,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
  return ref.id;
}

export async function inviteAdministrator(email, profileId) {
  const address = email.trim().toLowerCase();
  if (address === auth.currentUser?.email?.toLowerCase())
    throw Error(
      "Tu propia cuenta está protegida. Pide a otro administrador autorizado que revise tu acceso.",
    );
  if (
    !/^[^\s@/,;]+@[^\s@/,;]+\.[^\s@/,;]+$/.test(address) ||
    address.length > 254
  )
    throw Error("Revisa el correo ingresado.");
  if (!profileId) throw Error("Elige un perfil para esta persona.");
  const ref = doc(db, "administrators", address);
  await runTransaction(db, async (transaction) => {
    const [existing, profile] = await Promise.all([
      transaction.get(ref),
      transaction.get(doc(db, "accessProfiles", profileId)),
    ]);
    if (existing.exists())
      throw Error(
        "Este correo ya figura en la lista. Edita su acceso desde la ficha de la persona.",
      );
    if (!profile.exists() || profile.data().active !== true)
      throw Error("Este perfil ya no está disponible. Elige otro.");
    transaction.set(ref, {
      email: address,
      role: "admin",
      profileId,
      active: true,
      revision: 0,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateAdministrator(expected, { active, profileId }) {
  const ref = doc(db, "administrators", expected.id);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();
    if (
      !snapshot.exists() ||
      (current.revision || 0) !== (expected.revision || 0) ||
      current.active !== expected.active ||
      (current.profileId || "") !== (expected.profileId || "") ||
      (current.updatedAt?.toMillis?.() || 0) !==
        (expected.updatedAt?.toMillis?.() || 0)
    )
      throw Error(
        "El acceso cambió en otra sesión. Cierra y vuelve a abrir la ficha.",
      );
    if (!profileId) throw Error("Elige un perfil para guardar el acceso.");
    const profile = await transaction.get(doc(db, "accessProfiles", profileId));
    if (!profile.exists() || (active && !profile.data().active))
      throw Error("El perfil no está disponible. Elige otro.");
    transaction.update(ref, {
      active,
      profileId,
      revision: (current.revision || 0) + 1,
      updatedAt: serverTimestamp(),
    });
  });
}
