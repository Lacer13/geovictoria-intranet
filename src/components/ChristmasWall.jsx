import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Copy, Eye, EyeOff, Heart, Send, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../firebase";
import { greetingDate, greetingPayload, greetingText } from "../lib/greetings";
import { limaDate } from "../lib/season";
import "./christmas-wall.css";

export default function ChristmasWall({ moderate = false }) {
  const year = limaDate().getFullYear();
  const [composerOpen, setComposerOpen] = useState(false);
  const [data, setData] = useState({
    recipient: "",
    authorName: "",
    message: "",
    isAnonymous: false,
  });
  const [posts, setPosts] = useState([]),
    [count, setCount] = useState(30),
    [retry, setRetry] = useState(0);
  const [feed, setFeed] = useState("loading"),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false);
  const [slow, setSlow] = useState(false),
    [published, setPublished] = useState(null),
    [busyId, setBusyId] = useState(null);
  const alive = useRef(true),
    submitting = useRef(false),
    moderating = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    setFeed("loading");
    const source = collection(db, "christmasWalls", String(year), "greetings");
    const request = query(
      source,
      ...(!moderate ? [where("visible", "==", true)] : []),
      orderBy("createdAt", "desc"),
      limit(count),
    );
    return onSnapshot(
      request,
      { includeMetadataChanges: true },
      (snapshot) => {
        setPosts(
          snapshot.docs
            .filter((d) => moderate || !d.metadata.hasPendingWrites)
            .map((d) => ({ id: d.id, ...d.data() })),
        );
        setFeed(snapshot.metadata.fromCache ? "cached" : "ready");
      },
      () => setFeed("error"),
    );
  }, [year, count, retry, moderate]);
  const change = (key, value) => {
    setData((previous) => ({ ...previous, [key]: value }));
    setPublished(null);
  };
  const publish = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    let payload;
    try {
      payload = greetingPayload(data);
    } catch (e) {
      setError(e.message);
      return;
    }
    if (!navigator.onLine) {
      setError("Necesitas conexión para publicar. Conservamos tu saludo aquí.");
      return;
    }
    submitting.current = true;
    setSending(true);
    setSlow(false);
    setError("");
    setPublished(null);
    const timer = setTimeout(() => {
      if (alive.current) setSlow(true);
    }, 10000);
    try {
      const reference = doc(
        collection(db, "christmasWalls", String(year), "greetings"),
      );
      await setDoc(reference, { ...payload, createdAt: serverTimestamp() });
      if (alive.current) {
        setPublished(reference.id);
        setData((previous) => ({ ...previous, recipient: "", message: "" }));
        toast.success("Tu saludo ya está en el mural");
      }
    } catch {
      if (alive.current)
        setError(
          "No pudimos publicar. Tu texto sigue aquí para volver a intentarlo.",
        );
    } finally {
      clearTimeout(timer);
      submitting.current = false;
      if (alive.current) {
        setSending(false);
        setSlow(false);
      }
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(greetingText(greetingPayload(data)));
      toast.success("Saludo copiado");
    } catch (e) {
      setError(
        e.message?.startsWith("Escribe") ||
          e.message?.startsWith("El destinatario")
          ? e.message
          : "No pudimos copiar el saludo. Puedes seleccionar y copiar tu mensaje.",
      );
    }
  };
  const toggleVisibility = async (post) => {
    if (moderating.current) return;
    moderating.current = true;
    setBusyId(post.id);
    try {
      await updateDoc(
        doc(db, "christmasWalls", String(year), "greetings", post.id),
        { visible: !post.visible, moderatedAt: serverTimestamp() },
      );
      toast.success(
        post.visible ? "Saludo oculto del mural" : "Saludo restaurado",
      );
    } catch {
      toast.error("No pudimos cambiar la visibilidad. Intenta otra vez.");
    } finally {
      moderating.current = false;
      if (alive.current) setBusyId(null);
    }
  };
  return (
    <section
      className="christmas-wall"
      aria-labelledby={moderate ? "wall-admin-title" : "wall-title"}
    >
      <header className="wall-heading">
        <div>
          <span className="eyebrow">EL PERIÓDICO DEL EQUIPO · {year}</span>
          <h2 id={moderate ? "wall-admin-title" : "wall-title"}>
            Nuestro mural de Navidad
          </h2>
          <p>
            {moderate
              ? "Oculta un saludo del mural o restáuralo cuando corresponda. Las firmas anónimas no incluyen un nombre guardado."
              : "Los buenos deseos merecen un lugar para quedarse. Deja un saludo para alguien o para todo el equipo."}
          </p>
        </div>
        {!moderate && (
          <a
            className="btn btn-forest"
            href="#greeting-creator"
            onClick={() => setComposerOpen(true)}
          >
            <Send size={16} /> Escribir un saludo
          </a>
        )}
      </header>
      {!moderate && (
        <details
          className="disclosure panel seasonal-disclosure wall-composer"
          id="greeting-creator"
          open={composerOpen}
          onToggle={(event) => setComposerOpen(event.currentTarget.open)}
        >
          <summary>
            <Heart size={21} />
            <span>
              Crear un saludo
              <small>Publícalo aquí con tu firma o como anónimo</small>
            </span>
          </summary>
          <section className="greeting-builder">
            <form onSubmit={publish}>
              <fieldset disabled={sending} className="wall-fields">
                <div className="input-group">
                  <label htmlFor="greeting-recipient">
                    ¿A quién va dirigido?{" "}
                    <span className="muted">(opcional)</span>
                  </label>
                  <input
                    id="greeting-recipient"
                    className="input-field"
                    value={data.recipient}
                    onChange={(e) => change("recipient", e.target.value)}
                    maxLength={80}
                    placeholder="Una persona, un área o todo el equipo"
                  />
                </div>
                <label className="wall-anonymous">
                  <input
                    type="checkbox"
                    checked={data.isAnonymous}
                    onChange={(e) => change("isAnonymous", e.target.checked)}
                  />
                  <span>
                    Publicar como anónimo
                    <small>
                      En el mural aparecerá “Anónimo” en lugar de tu firma.
                    </small>
                  </span>
                </label>
                {!data.isAnonymous && (
                  <div className="input-group">
                    <label htmlFor="greeting-author">Tu firma</label>
                    <input
                      id="greeting-author"
                      className="input-field"
                      value={data.authorName}
                      onChange={(e) => change("authorName", e.target.value)}
                      minLength={2}
                      maxLength={80}
                      required
                      placeholder="Tu nombre"
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="input-group">
                  <label htmlFor="greeting-text">Tu mensaje</label>
                  <textarea
                    id="greeting-text"
                    className="input-field"
                    rows={4}
                    value={data.message}
                    onChange={(e) => change("message", e.target.value)}
                    minLength={3}
                    maxLength={1000}
                    required
                    placeholder="Gracias por acompañarnos este año…"
                  />
                  <small className="muted">{data.message.length}/1000</small>
                </div>
                <p className="greeting-privacy">
                  Se publicará en este mural y podrán leerlo las personas que
                  visiten el portal.
                </p>
                <div className="wall-actions">
                  <button className="btn btn-forest" type="submit">
                    <Send size={16} />
                    {sending ? "Publicando…" : "Publicar en el mural"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={copy}
                  >
                    <Copy size={16} />
                    Copiar saludo
                  </button>
                </div>
              </fieldset>
              {slow && (
                <p role="status" className="inline-notice">
                  La publicación está tardando. Espera la confirmación; tu texto
                  se conserva.
                </p>
              )}
              {error && (
                <p role="alert" className="wall-error">
                  {error}
                </p>
              )}
              {published && (
                <p role="status" className="wall-success">
                  Tu saludo ya está publicado.{" "}
                  <a href={`#saludo-${published}`}>Verlo en el mural</a>
                </p>
              )}
            </form>
            <div
              className="greeting-preview"
              aria-label="Vista previa del saludo"
            >
              <span className="eyebrow">ASÍ SE VERÁ TU SALUDO</span>
              <h3>
                {data.recipient.trim()
                  ? `Para ${data.recipient.trim()}`
                  : "Para todo el equipo"}
              </h3>
              <p>{data.message || "Tus palabras harán brillar este rincón…"}</p>
              <span className="greeting-signature">
                Con cariño,
                <br />
                <strong>
                  {data.isAnonymous
                    ? "Anónimo"
                    : data.authorName.trim() || "Tu firma"}
                </strong>
              </span>
            </div>
          </section>
        </details>
      )}
      <div className="wall-edition" id="mural">
        <span>BUENOS DESEOS · AGRADECIMIENTOS · EQUIPO</span>
        <span>EDICIÓN NAVIDEÑA {year}</span>
      </div>
      {feed === "loading" && (
        <p role="status" className="wall-state">
          Abriendo el mural…
        </p>
      )}
      {feed === "cached" && (
        <p role="status" className="inline-notice">
          {posts.length
            ? "Mostrando los saludos guardados mientras conectamos con el mural."
            : "Conectando con el mural…"}
        </p>
      )}
      {feed === "error" && (
        <div role="alert" className="wall-state">
          <p>No pudimos cargar los saludos. Tu mensaje sigue en el editor.</p>
          <button
            className="btn btn-secondary"
            onClick={() => setRetry((v) => v + 1)}
          >
            Volver a cargar el mural
          </button>
        </div>
      )}
      {feed === "ready" && !posts.length && (
        <div className="wall-state wall-empty">
          <Heart size={28} />
          <h3>El primer saludo puede ser el tuyo</h3>
          <p>
            {moderate
              ? "Todavía no hay saludos en esta edición."
              : "Escribe unas palabras y aparecerán aquí para compartirlas con el equipo."}
          </p>
        </div>
      )}
      <div className="wall-grid">
        {posts.map((post) => (
          <article
            key={post.id}
            id={`saludo-${post.id}`}
            className={`wall-note ${post.visible ? "" : "wall-note-hidden"}`}
          >
            <div className="wall-note-top">
              <span>
                {post.recipient
                  ? `PARA ${post.recipient}`
                  : "PARA TODO EL EQUIPO"}
              </span>
              <Heart size={17} aria-hidden="true" />
            </div>
            <p className="wall-note-message">{post.message}</p>
            <footer>
              <div className="wall-author">
                {post.isAnonymous ? (
                  <Heart size={18} />
                ) : (
                  <UserRound size={18} />
                )}
                <span>
                  <strong>
                    {post.isAnonymous ? "Anónimo" : post.authorName}
                  </strong>
                  <time dateTime={post.createdAt?.toDate?.().toISOString()}>
                    {greetingDate(post.createdAt)}
                  </time>
                </span>
              </div>
              {moderate && (
                <>
                  <span className="wall-visibility">
                    {post.visible ? "Publicado" : "Oculto"}
                  </span>
                  <button
                    className="text-link"
                    disabled={busyId !== null}
                    onClick={() => toggleVisibility(post)}
                  >
                    {post.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    {busyId === post.id
                      ? "Guardando…"
                      : post.visible
                        ? "Ocultar del mural"
                        : "Restaurar saludo"}
                  </button>
                </>
              )}
            </footer>
          </article>
        ))}
      </div>
      {posts.length >= count && count < 150 && (
        <button
          className="btn btn-secondary wall-more"
          onClick={() => setCount((v) => Math.min(150, v + 30))}
        >
          Ver más saludos
        </button>
      )}
      {posts.length >= 150 && (
        <p className="muted">
          Esta edición muestra los 150 saludos más recientes.
        </p>
      )}
    </section>
  );
}
