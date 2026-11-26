import { useRef, useState } from "react";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { validMailSettings } from "../../lib/secretSanta";
import {
  saveSantaEmailSettings,
  sendSantaTestEmail,
} from "../../lib/secretSantaStore";
import {
  SECRET_SANTA_EMAIL_SUBJECT,
  SECRET_SANTA_EMAIL_TEMPLATE,
} from "../../data/secretSantaTemplate";
import { auth } from "../../auth";
import { mailSettingsVersion } from "../../lib/secretSantaEmail";
import SantaMailLimits from "../SantaMailLimits";
import "../../secret-santa-links.css";
import "../../secret-santa-experience.css";
import { emptySettings, messageFor, copyText } from "./shared";

export default function SantaMailSettings({ initial, onSaved }) {
  const [settings, setSettings] = useState(() => ({
    ...emptySettings,
    ...initial,
  }));
  const [savedVersion, setSavedVersion] = useState(() =>
    mailSettingsVersion(initial),
  );
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [confirmTest, setConfirmTest] = useState(false);
  const [result, setResult] = useState(null);
  const [received, setReceived] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const lastAttempt = useRef(0);
  const currentVersion = mailSettingsVersion(settings);
  const ready = validMailSettings(settings) && savedVersion === currentVersion;
  const change = (update) => {
    setSettings((old) => ({ ...old, ...update }));
    setResult(null);
    setReceived(false);
    setConfirmTest(false);
    setError("");
  };
  const save = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await saveSantaEmailSettings(settings);
      const normalized = {
        ...settings,
        ...Object.fromEntries(
          ["serviceId", "templateId", "publicKey"].map((key) => [
            key,
            settings[key].trim(),
          ]),
        ),
      };
      setSettings(normalized);
      setSavedVersion(mailSettingsVersion(normalized));
      toast.success("Configuración guardada. Ya puedes enviar una prueba.");
    } catch (err) {
      setError(messageFor(err, "No pudimos guardar la configuración."));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const testEmail = async () => {
    if (lock.current || !ready) return;
    if (Date.now() - lastAttempt.current < 60000) {
      setError(
        "Espera un minuto antes de repetir la prueba. Revisa primero tu correo y el historial de EmailJS.",
      );
      return;
    }
    lock.current = true;
    lastAttempt.current = Date.now();
    setTesting(true);
    setConfirmTest(false);
    setError("");
    setResult(null);
    setReceived(false);
    try {
      setResult(await sendSantaTestEmail(settings));
    } catch (err) {
      setError(
        messageFor(
          err,
          "No pudimos confirmar la prueba. Revisa el historial de EmailJS antes de repetirla.",
        ),
      );
    } finally {
      lock.current = false;
      setTesting(false);
    }
  };
  return (
    <div className="santa-mail-settings">
      <div className="mail-setup-status">
        <span className={ready ? "complete" : ""}>1 · Configuración</span>
        <span className={result ? "complete" : ""}>2 · Prueba</span>
        <span className={received ? "complete" : ""}>3 · Recepción</span>
      </div>
      <details className="disclosure panel mail-guide">
        <summary>Conectar Outlook paso a paso</summary>
        <div className="disclosure-body">
          <ol>
            <li>
              Crea tu cuenta en{" "}
              <a
                href="https://dashboard.emailjs.com/sign-up"
                target="_blank"
                rel="noreferrer"
              >
                EmailJS
              </a>
              . En <strong>Email Services → Add New Service</strong>, elige{" "}
              <strong>Outlook 365</strong> y autoriza tu cuenta. Si Microsoft
              solicita aprobación de tu organización, consúltalo con su
              administrador.
            </li>
            <li>
              Crea una plantilla: destinatario <code>{"{{to_email}}"}</code>,
              nombre <code>{"{{to_name}}"}</code> y asunto{" "}
              <code>{SECRET_SANTA_EMAIL_SUBJECT}</code>. Usa el remitente
              conectado, sin CC ni BCC.
              <button
                className="text-link"
                type="button"
                onClick={() =>
                  copyText(
                    SECRET_SANTA_EMAIL_TEMPLATE,
                    "Plantilla HTML copiada",
                  )
                }
              >
                Copiar plantilla navideña
              </button>
              <button
                className="text-link"
                type="button"
                onClick={() =>
                  copyText(SECRET_SANTA_EMAIL_SUBJECT, "Asunto copiado")
                }
              >
                Copiar asunto
              </button>
            </li>
            <li>
              Si tu plan de EmailJS incluye la restricción de dominios, autoriza
              este origen: <code>{window.location.origin}</code>. Consulta las
              funciones y la cuota disponible en su panel.
            </li>
            <li>
              Copia aquí el Service ID, Template ID y la clave{" "}
              <strong>pública</strong>. No ingreses contraseñas ni claves
              privadas.
            </li>
          </ol>
          <a
            href="https://www.emailjs.com/docs/user-guide/connecting-email-services/"
            target="_blank"
            rel="noreferrer"
          >
            Ver guía oficial de conexión ↗
          </a>
        </div>
      </details>
      <form onSubmit={save}>
        <fieldset disabled={busy || testing}>
          {[
            ["serviceId", "Service ID", "service_…"],
            ["templateId", "Template ID", "template_…"],
            [
              "publicKey",
              "Clave pública de EmailJS",
              "Identificador público de tu cuenta",
            ],
          ].map(([key, label, placeholder]) => (
            <div className="input-group" key={key}>
              <label htmlFor={`santa-mail-${key}`}>{label}</label>
              <input
                id={`santa-mail-${key}`}
                className="input-field"
                autoComplete="off"
                maxLength={100}
                placeholder={placeholder}
                value={settings[key]}
                onChange={(e) => change({ [key]: e.target.value })}
                required={settings.enabled}
                pattern="[a-zA-Z0-9_-]+"
              />
            </div>
          ))}
          <label className="santa-review-checkbox">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => change({ enabled: e.target.checked })}
            />
            Habilitar envíos desde el panel
          </label>
        </fieldset>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy || testing}
            onClick={onSaved}
          >
            Cerrar
          </button>
          <button className="btn btn-forest" disabled={busy || testing}>
            {busy ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </form>
      <section className="mail-test-panel" aria-labelledby="mail-test-title">
        <h3 id="mail-test-title">Comprueba la recepción</h3>
        <p>
          La prueba solo llegará a <strong>{auth.currentUser?.email}</strong>.
          No utiliza participantes ni realiza un sorteo.
        </p>
        {!ready && (
          <p className="field-caption">
            Guarda y habilita la configuración para enviar la prueba.
          </p>
        )}
        {confirmTest ? (
          <div className="inline-notice mail-test-confirm">
            <p>
              Se enviará un correo de prueba a tu dirección y consumirá una
              solicitud del proveedor.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmTest(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-forest"
                onClick={testEmail}
              >
                Confirmar envío de prueba
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!ready || busy || testing}
            onClick={() => setConfirmTest(true)}
          >
            <Mail size={16} />
            {testing ? "Enviando prueba…" : "Enviar prueba a mi correo"}
          </button>
        )}
        {result && (
          <div className="mail-test-result" role="status">
            <strong>
              {result.provider === "demo"
                ? "Prueba simulada: no se envió ningún correo"
                : "Solicitud aceptada por EmailJS"}
            </strong>
            <p>
              {result.provider === "demo"
                ? "En producción deberás comprobar la recepción real."
                : "Abre Outlook y revisa también correo no deseado. La aceptación del proveedor no confirma la entrega."}
            </p>
            {result.provider !== "demo" && (
              <label className="santa-review-checkbox">
                <input
                  type="checkbox"
                  checked={received}
                  onChange={(e) => setReceived(e.target.checked)}
                />
                Confirmo que recibí el correo de prueba
              </label>
            )}
            {received && (
              <p>
                Recepción confirmada por ti en esta sesión. Ya puedes preparar
                el envío del sorteo.
              </p>
            )}
          </div>
        )}
      </section>
      <SantaMailLimits />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="local-save-caption">
        La recepción de prueba se confirma en esta sesión.{" "}
        <a
          href="https://www.emailjs.com/pricing/"
          target="_blank"
          rel="noreferrer"
        >
          Consultar plan y cuotas ↗
        </a>
      </p>
    </div>
  );
}
