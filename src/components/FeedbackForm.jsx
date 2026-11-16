import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  waitForPendingWrites,
} from "firebase/firestore";
import {
  CheckCircle2,
  HeartHandshake,
  LoaderCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { db } from "../firebase";

export default function FeedbackForm() {
  const [data, setData] = useState({ name: "", department: "", message: "" });
  const [anonymous, setAnonymous] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const alive = useRef(true);
  const sending = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (sending.current) return;
    if (!data.message.trim() || (!anonymous && !data.name.trim())) {
      setError("Completa los campos con información válida.");
      return;
    }
    if (!navigator.onLine) {
      setError(
        "Necesitas conexión para enviar tu mensaje. Tu texto sigue aquí.",
      );
      return;
    }
    sending.current = true;
    setStatus("loading");
    setError("");
    setSlow(false);
    const timer = setTimeout(() => {
      if (alive.current) setSlow(true);
    }, 10000);
    try {
      const ref = doc(collection(db, "feedbacks"));
      await setDoc(ref, {
        isAnonymous: anonymous,
        name: anonymous ? "Anónimo" : data.name.trim(),
        department: anonymous ? "" : data.department,
        message: data.message.trim(),
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      await waitForPendingWrites(db);
      if (alive.current) {
        setStatus("success");
        setData({ name: "", department: "", message: "" });
      }
    } catch {
      if (alive.current) {
        setStatus("idle");
        setError(
          "No pudimos enviar tu mensaje. Conservamos tu texto para que vuelvas a intentarlo.",
        );
      }
    } finally {
      clearTimeout(timer);
      sending.current = false;
      if (alive.current) setSlow(false);
    }
  };
  return (
    <div className="feedback-page page-enter">
      <div className="page-heading">
        <span className="eyebrow">UN MEJOR LUGAR SE CONSTRUYE ESCUCHANDO</span>
        <h1>Tu voz nos importa.</h1>
        <p>
          Comparte una idea, pide apoyo o cuéntanos algo que debemos mejorar.
        </p>
      </div>
      <div className="feedback-layout">
        <section className="panel feedback-form">
          <div className="panel-heading">
            <h2>
              <HeartHandshake size={21} /> Te escuchamos
            </h2>
            <span className="department-pill">Canal de solicitudes</span>
          </div>
          {status === "success" ? (
            <div className="feedback-success" role="status">
              <CheckCircle2 size={52} />
              <h2>Gracias por compartirlo.</h2>
              <p>
                Tu mensaje se guardó en el buzón de solicitudes para su revisión
                por Administración.
              </p>
              <button
                className="btn btn-forest"
                onClick={() => {
                  setStatus("idle");
                  setAnonymous(false);
                }}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="anonymous-option">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  disabled={status === "loading"}
                />
                <span>
                  <strong>Prefiero no incluir mi nombre</strong>
                  <small>Tu nombre y área no se añadirán al mensaje.</small>
                </span>
                <ShieldCheck size={21} />
              </label>
              {!anonymous && (
                <div className="form-two-columns">
                  <div className="input-group">
                    <label htmlFor="feedback-name">
                      Tu nombre <span>*</span>
                    </label>
                    <input
                      id="feedback-name"
                      className="input-field"
                      autoComplete="name"
                      required
                      maxLength={100}
                      value={data.name}
                      onChange={(e) =>
                        setData({ ...data, name: e.target.value })
                      }
                      placeholder="¿Cómo te llamas?"
                      disabled={status === "loading"}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="feedback-department">
                      Tu área <span>*</span>
                    </label>
                    <select
                      id="feedback-department"
                      className="input-field"
                      required
                      value={data.department}
                      onChange={(e) =>
                        setData({ ...data, department: e.target.value })
                      }
                      disabled={status === "loading"}
                    >
                      <option value="">Selecciona tu área</option>
                      {[
                        "Administración",
                        "Comercial",
                        "Operaciones",
                        "Finanzas y Cobranzas",
                        "Tecnología",
                        "Recursos Humanos",
                        "Otra área",
                      ].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="input-group">
                <label htmlFor="feedback-message">
                  ¿Qué te gustaría compartir? <span>*</span>
                </label>
                <textarea
                  id="feedback-message"
                  className="input-field"
                  rows={7}
                  required
                  maxLength={5000}
                  value={data.message}
                  onChange={(e) =>
                    setData({ ...data, message: e.target.value })
                  }
                  placeholder="Cuéntanos el contexto y cómo podemos ayudarte…"
                  disabled={status === "loading"}
                />
                <span className="field-caption">
                  Evita incluir contraseñas o datos bancarios.
                  <span>{data.message.length}/5000</span>
                </span>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {slow && (
                <p className="inline-notice" role="status">
                  La conexión está tardando. Tu envío sigue en proceso; mantén
                  esta página abierta.
                </p>
              )}
              <button
                className="btn btn-forest"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}
                {status === "loading"
                  ? "Enviando mensaje…"
                  : "Enviar mi mensaje"}
              </button>
            </form>
          )}
        </section>
        <aside className="feedback-aside">
          <span className="quick-icon green">
            <ShieldCheck size={26} />
          </span>
          <h2>Un espacio para expresarte.</h2>
          <p>
            Los mensajes se guardan en el buzón de la intranet para su revisión
            por el equipo administrador.
          </p>
          <div>
            <strong>Comparte con tranquilidad</strong>
            <p>
              La opción sin nombre omite tu nombre y área del reporte. Incluye
              solo los datos necesarios para explicar tu solicitud.
            </p>
          </div>
          <div>
            <strong>¿Esperas una respuesta?</strong>
            <p>
              Si deseas que puedan contactarte, incluye un correo de trabajo en
              tu mensaje.
            </p>
          </div>
          <small>
            Este formulario no envía correos automáticos ni sustituye los
            canales de atención urgente de tu organización.
          </small>
        </aside>
      </div>
    </div>
  );
}
