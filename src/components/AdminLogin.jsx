import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Lock, MailCheck } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../auth";

export default function AdminLogin({ loading, accessError, unverifiedUser, onRefresh }) {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("correo") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [register, setRegister] = useState(params.get("crear") === "1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (register && password !== confirmation) {
      setError("Las contraseñas deben coincidir.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (register)
        await createUserWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );
      else await signInWithEmailAndPassword(auth, (unverifiedUser?.email || email).trim(), password);
      setShowSignIn(false);
      onRefresh();
      setPassword("");
      setConfirmation("");
    } catch (err) {
      setError(
        register && err.code === "auth/email-already-in-use"
          ? "Este correo ya tiene una cuenta. Ingresa o utiliza Activar o recuperar acceso."
          : register
            ? "No pudimos crear tu cuenta. Revisa el correo y utiliza una contraseña de al menos 12 caracteres."
            : "No pudimos iniciar sesión. Revisa tus credenciales o activa tu acceso con la opción de recuperación.",
      );
    } finally {
      setBusy(false);
    }
  };
  const recover = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(
        "Escribe tu correo de trabajo para activar o recuperar tu acceso.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const address = unverifiedUser?.email || email.trim();
      await sendPasswordResetEmail(auth, address, {
        url: `${window.location.origin}/admin?correo=${encodeURIComponent(address)}`,
      });
      setNotice(
        "Si el correo tiene una cuenta, recibirás un enlace para establecer tu contraseña. Revisa también la carpeta de correo no deseado.",
      );
    } catch {
      setError(
        "No pudimos solicitar el enlace. Espera un momento y vuelve a intentarlo.",
      );
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sendEmailVerification(unverifiedUser, {
        url: `${window.location.origin}/admin`,
      });
      setNotice(
        "Enviamos un enlace de verificación a tu correo. Ábrelo y luego vuelve aquí para comprobar el acceso.",
      );
    } catch {
      setError(
        "No pudimos enviar el enlace. Espera un momento y vuelve a intentarlo.",
      );
    } finally {
      setBusy(false);
    }
  };
  const refresh = async () => {
    setBusy(true);
    setError("");
    try {
      await unverifiedUser.reload();
      if (!unverifiedUser.emailVerified)
        setError(
          "Tu correo todavía no está verificado. Abre el enlace de verificación.",
        );
      else onRefresh();
    } catch {
      setError(
        "No pudimos comprobar la verificación. Vuelve a iniciar sesión.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel admin-login page-enter">
      <span className="quick-icon green">
        {unverifiedUser ? <MailCheck size={24} /> : <Lock size={24} />}
      </span>
      <span className="eyebrow">ADMINISTRACIÓN</span>
      <h1>
        {unverifiedUser && !showSignIn
          ? "Verifica tu correo."
          : register
            ? "Crea tu acceso."
            : "Cuidamos este espacio."}
      </h1>
      <p>
        {unverifiedUser && !showSignIn
          ? `Para proteger el portal, confirma que eres titular de ${unverifiedUser.email}. Tu correo también debe estar autorizado por un administrador.`
          : register
            ? "Utiliza el correo autorizado por tu administrador. Crear una cuenta no concede permisos de administración."
            : "Ingresa con tu cuenta autorizada para gestionar el espacio de nuestro equipo."}
      </p>
      {unverifiedUser && !showSignIn ? (
        <div className="admin-activation">
          <button
            className="btn btn-forest"
            disabled={busy || loading}
            onClick={verify}
          >
            Enviar enlace de verificación
          </button>
          <button
            className="btn btn-secondary"
            disabled={busy || loading}
            onClick={refresh}
          >
            Ya verifiqué mi correo
          </button>
          <button
            className="text-link"
            disabled={busy || loading}
            onClick={() => {
              setEmail(unverifiedUser.email || "");
              setRegister(false);
              setShowSignIn(true);
              setError("");
              setNotice("");
            }}
          >
            Ingresar con mi nueva contraseña
          </button>
          <button
            className="text-link"
            disabled={busy}
            onClick={() => signOut(auth)}
          >
            Usar otra cuenta
          </button>
          <p className="field-caption">
            Si cambiaste tu contraseña desde un correo, puedes ingresar con ella aquí.
            Comprobaremos la verificación automáticamente al volver del enlace.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={submit}>
            <div className="input-group">
              <label htmlFor="admin-email">Correo de trabajo</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="nombre@geovictoria.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy || loading || !!unverifiedUser}
              />
            </div>
            <div className="input-group">
              <label htmlFor="admin-password">Contraseña</label>
              <input
                id="admin-password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={register ? 12 : undefined}
                required
                disabled={busy || loading}
              />
            </div>
            {register && (
              <div className="input-group">
                <label htmlFor="admin-confirm-password">
                  Confirmar contraseña
                </label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  className="input-field"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  minLength={12}
                  required
                  disabled={busy || loading}
                />
              </div>
            )}
            <button
              type="submit"
              className="btn btn-forest"
              disabled={busy || loading}
            >
              {busy || loading
                ? "Comprobando…"
                : register
                  ? "Crear mi acceso"
                  : "Entrar a administración"}
              <ArrowRight size={15} />
            </button>
          </form>
          <div className="admin-login-options">
            <button
              className="text-link"
              disabled={busy || loading}
              onClick={recover}
            >
              Activar o recuperar acceso
            </button>
            {!unverifiedUser && <button
              className="text-link"
              disabled={busy || loading}
              onClick={() => {
                setRegister((v) => !v);
                setError("");
                setNotice("");
                setPassword("");
                setConfirmation("");
              }}
            >
              {register ? "Ya tengo una cuenta" : "Crear acceso con invitación"}
            </button>}
            {unverifiedUser && <button className="text-link" disabled={busy || loading} onClick={() => setShowSignIn(false)}>Volver a la verificación</button>}
          </div>
        </>
      )}
      {(error || accessError) && (
        <p className="form-error" role="alert">
          {error || accessError}
        </p>
      )}
      {notice && (
        <p className="inline-notice" role="status">
          {notice}
        </p>
      )}
      <p className="admin-login-caption">
        Cada administrador utiliza su propia cuenta. Los permisos se conceden
        desde Administración.
      </p>
    </section>
  );
}
