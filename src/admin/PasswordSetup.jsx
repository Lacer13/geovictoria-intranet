import { useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { sendPasswordResetEmail, updatePassword } from "firebase/auth";
import { validateNewPassword } from "../lib/adminPassword";
import { auth } from "../auth";

export default function PasswordSetup({ user, onSignOut, onContinue }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const recover = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordResetEmail(auth, user.email, {
        url: `${window.location.origin}/admin?correo=${encodeURIComponent(user.email)}`,
      });
      setNotice("Enviamos un enlace para establecer tu contraseña. Ábrelo y vuelve a ingresar con la nueva contraseña.");
    } catch {
      setError("No pudimos enviar el enlace. Espera un momento y vuelve a intentarlo.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    try {
      validateNewPassword(password, confirmation);
      lock.current = true;
      setBusy(true);
      setError("");
      setNotice("");
      await updatePassword(user, password);
      setSaved(true);
      setPassword("");
      setConfirmation("");
      await user.getIdToken(true);
      onContinue();
    } catch (err) {
      setError(
        err.code === "auth/requires-recent-login"
          ? "Vuelve a iniciar sesión con tu contraseña actual para completar el cambio."
          : err.code === "auth/weak-password" ||
              err.code === "auth/password-does-not-meet-requirements"
            ? "Elige una contraseña más segura que cumpla la política de tu cuenta."
            : err.code
              ? "No pudimos completar el cambio. Revisa tu conexión y vuelve a intentarlo."
              : err.message,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="panel admin-login admin-password-setup">
      <span className="quick-icon green">
        <KeyRound size={24} />
      </span>
      <span className="eyebrow">TU PRIMER INGRESO</span>
      <h1>Elige tu propia contraseña.</h1>
      <p>
        Estás entrando como <strong>{user.email}</strong>. Reemplaza la
        contraseña inicial por una que solo tú conozcas.
      </p>
      {saved ? (
        <div className="inline-notice" role="status">
          Tu contraseña se guardó. Estamos comprobando el acceso.
          <button
            className="text-link"
            disabled={busy}
            onClick={() =>
              user
                .getIdToken(true)
                .then(onContinue)
                .catch(() =>
                  setError(
                    "No pudimos comprobar la sesión. Vuelve a ingresar con tu nueva contraseña.",
                  ),
                )
            }
          >
            Continuar con mi nueva contraseña
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label className="input-group">
              <span>Nueva contraseña</span>
              <input
                className="input-field"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                minLength={12}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="input-group">
              <span>Confirmar nueva contraseña</span>
              <input
                className="input-field"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                minLength={12}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
            <p className="field-caption">
              Al menos 12 caracteres. Puedes usar una frase fácil de recordar
              para ti.
            </p>
            <button
              type="button"
              className="text-link admin-password-visibility"
              aria-pressed={visible}
              onClick={() => setVisible((value) => !value)}
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
              {visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
            </button>
            <button className="btn btn-forest" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" /> Guardando…
                </>
              ) : (
                "Guardar mi contraseña y continuar"
              )}
            </button>
          </fieldset>
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && <p className="inline-notice" role="status">{notice}</p>}
      <button className="text-link" disabled={busy} onClick={recover}>
        Establecer mi contraseña por correo
      </button>
      <button className="text-link" disabled={busy} onClick={onSignOut}>
        Cerrar sesión
      </button>
    </section>
  );
}
