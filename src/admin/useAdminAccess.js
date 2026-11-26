import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth } from "../auth";
import { db } from "../firebase";
import { resolveAccess } from "./permissions";
import { passwordSetupRequired } from "./passwordStatus";
import { loadAdminIdentity, sessionNeedsLogin } from "./session";

const empty = {
  loading: true,
  user: null,
  access: null,
  error: "",
  unverifiedUser: null,
  passwordSetupUser: null,
};
export function useAdminAccess() {
  const [state, setState] = useState(empty);
  const [revision, setRevision] = useState(0);
  const refreshAccess = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let alive = true,
      generation = 0;
    let stopMember = () => {},
      stopProfile = () => {};
    // reload() itself emits token events; listen for account changes and use
    // refreshAccess for verification/password changes to avoid a reload loop.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const session = ++generation;
      stopMember();
      stopProfile();
      stopMember = () => {};
      stopProfile = () => {};
      const current = () => alive && session === generation;
      const update = (data) => {
        if (current()) setState({ ...empty, loading: false, user, ...data });
      };
      if (!user) {
        update({ user: null });
        return;
      }
      setState((previous) => ({
        ...empty,
        user,
        unverifiedUser: previous.unverifiedUser?.uid === user.uid ? user : null,
      }));
      try {
        const { claims } = await loadAdminIdentity(user);
        if (!current()) return;
        const needsPassword = await passwordSetupRequired(user, claims);
        if (!current()) return;
        if (needsPassword) {
          update({ passwordSetupUser: user });
          return;
        }
        if (!user.emailVerified) {
          update({ unverifiedUser: user });
          return;
        }
        const publish = (membership, profile = null, profileId = "") => {
          const access = resolveAccess({
            claims,
            emailVerified: user.emailVerified,
            membership,
            profile,
            profileId,
          });
          update({
            access,
            error: access
              ? ""
              : "Tu acceso está desactivado o tu perfil no está disponible. Consulta con el administrador principal.",
          });
        };
        if (!user.email) {
          publish(null);
          return;
        }
        let roleGeneration = 0;
        stopMember = onSnapshot(
          doc(db, "administrators", user.email.toLowerCase()),
          (snapshot) => {
            if (!current()) return;
            const roleSession = ++roleGeneration;
            const currentRole = () =>
              current() && roleSession === roleGeneration;
            stopProfile();
            stopProfile = () => {};
            const membership = snapshot.exists() ? snapshot.data() : null;
            if (
              membership?.role === "admin" &&
              membership.active === true &&
              membership.profileId
            ) {
              // Clear the previous permissions while resolving a changed profile.
              setState({ ...empty, user });
              const profileId = membership.profileId;
              stopProfile = onSnapshot(
                doc(db, "accessProfiles", profileId),
                (profileSnapshot) => {
                  if (currentRole())
                    publish(
                      membership,
                      profileSnapshot.exists() ? profileSnapshot.data() : null,
                      profileId,
                    );
                },
                () => {
                  if (currentRole())
                    update({
                      error:
                        "No pudimos comprobar tu perfil. Reintenta la conexión o consulta con el administrador.",
                    });
                },
              );
            } else publish(membership);
          },
          () => {
            roleGeneration++;
            stopProfile();
            update({
              error:
                "No pudimos verificar tus permisos. Vuelve a iniciar sesión.",
            });
          },
        );
      } catch (error) {
        if (!current()) return;
        if (sessionNeedsLogin(error)) {
          await signOut(auth).catch(() => {});
          update({ user: null, error: "Tu sesión cambió. Ingresa con tu nueva contraseña." });
          return;
        }
        update({
          error: "No pudimos verificar tu acceso. Vuelve a intentarlo.",
        });
      }
    });
    return () => {
      alive = false;
      generation++;
      unsubscribe();
      stopMember();
      stopProfile();
    };
  }, [revision]);
  useEffect(() => {
    if (!state.unverifiedUser || state.loading) return;
    const checkVisible = () => {
      if (document.visibilityState === "visible") refreshAccess();
    };
    window.addEventListener("focus", checkVisible);
    document.addEventListener("visibilitychange", checkVisible);
    const timer = window.setInterval(checkVisible, 10000);
    return () => {
      window.removeEventListener("focus", checkVisible);
      document.removeEventListener("visibilitychange", checkVisible);
      window.clearInterval(timer);
    };
  }, [state.unverifiedUser, state.loading, refreshAccess]);
  return {
    ...state,
    refreshAccess,
    can: (permission) => !!state.access?.permissions.includes(permission),
  };
}
