import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Heart,
  Link2,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { CARD_PATTERN, readableExchangeDate } from "../lib/secretSanta";
import { getSantaCard } from "../lib/secretSantaStore";

export default function SecretSanta() {
  return (
    <div className="page-enter santa-public">
      <div className="page-heading">
        <span className="eyebrow">UN REGALO. UNA SONRISA. UN SECRETO.</span>
        <h1>La ilusión de regalar, en equipo.</h1>
        <p>Nuestro amigo secreto de Navidad ya tiene su propio espacio.</p>
      </div>
      <section className="santa-welcome">
        <div>
          <span className="season-pill">
            <span /> AMIGO SECRETO GEOVICTORIA
          </span>
          <h2>
            Alguien va a sonreír
            <br />
            gracias a <em>ti.</em>
          </h2>
          <p>
            La organización registra al equipo y realiza el sorteo. Cada persona
            recibe por correo su asignación y un enlace privado para volver a
            consultarla.
          </p>
          <Link className="btn btn-forest" to="/admin?seccion=amigo-secreto">
            Organizar un sorteo <ArrowRight size={16} />
          </Link>
          <small>La gestión está reservada a administradores.</small>
        </div>
        <div className="santa-gift-art" aria-hidden="true">
          <span>✧</span>
          <Gift size={120} strokeWidth={0.8} />
          <i>✦</i>
          <Heart size={25} />
        </div>
      </section>
      <div className="santa-how">
        <article className="panel">
          <Mail />
          <h2>Revisa tu correo</h2>
          <p>
            Cuando la organización envíe el sorteo, encontrarás a quién le
            regalarás. Revisa también correo no deseado.
          </p>
        </article>
        <article className="panel">
          <Link2 />
          <h2>Guarda tu enlace</h2>
          <p>
            El correo incluye una invitación privada. Ábrela cuando quieras
            recordar tu asignación.
          </p>
        </article>
        <article className="panel">
          <LockKeyhole />
          <h2>Conserva la sorpresa</h2>
          <p>
            Tu enlace permite ver tu resultado. Compártelo solo si quieres
            revelar tu amigo secreto.
          </p>
        </article>
      </div>
      <div className="help-banner">
        <Sparkles size={22} />
        <div>
          <strong>¿No encuentras tu invitación?</strong>
          <p>
            La organización conserva las asignaciones y puede reenviar tu correo
            o recuperar tu enlace.
          </p>
        </div>
        <Link to="/directorio" className="text-link">
          Contactar al equipo <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

export function SecretSantaReveal() {
  const { hash } = useLocation();
  const token = hash.slice(1);
  const [result, setResult] = useState({ token: "", data: null, error: false });
  const [revealedToken, setRevealedToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const valid = CARD_PATTERN.test(token);
  useEffect(() => {
    if (!valid) return;
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setResult({ token, data: null, error: true });
    }, 12000);
    getSantaCard(token)
      .then((data) => {
        if (active) setResult({ token, data, error: false });
      })
      .catch(() => {
        if (active) setResult({ token, data: null, error: true });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [token, valid, attempt]);
  if (!valid || (result.token === token && result.error))
    return (
      <section className="panel santa-reveal santa-missing">
        <LockKeyhole size={38} />
        <h1>No pudimos abrir tu invitación</h1>
        <p>
          Revisa que hayas copiado el enlace completo. También puede estar
          archivado o haber un problema de conexión.
        </p>
        {valid && (
          <button
            className="btn btn-forest"
            onClick={() => {
              setResult({ token: "", data: null, error: false });
              setAttempt((v) => v + 1);
            }}
          >
            Volver a intentar
          </button>
        )}
        <Link to="/amigo-secreto" className="text-link">
          Cómo recuperar mi invitación <ArrowRight size={15} />
        </Link>
      </section>
    );
  if (result.token !== token)
    return (
      <div className="route-loading" role="status">
        <Gift className="animate-float" /> Abriendo tu invitación privada…
      </div>
    );
  const card = result.data;
  const revealed = revealedToken === token;
  return (
    <div className="santa-reveal-page page-enter">
      <Link to="/amigo-secreto" className="text-link back-link">
        <ArrowLeft size={15} /> Nuestro amigo secreto
      </Link>
      <section
        className={`panel santa-reveal ${revealed ? "is-revealed" : ""}`}
      >
        <span className="eyebrow">{card.title}</span>
        <span className="santa-reveal-emblem">
          <Gift size={49} strokeWidth={1.2} />
          <i aria-hidden="true">✦</i>
        </span>
        <h1>Hola, {card.giverName}.</h1>
        <p>
          {revealed
            ? "Este año, tu regalo será para…"
            : "Tenemos una sorpresa solo para ti."}
        </p>
        {revealed ? (
          <>
            <div className="santa-recipient" role="status">
              <span aria-hidden="true">✧</span>
              <strong>{card.recipientName}</strong>
              <span aria-hidden="true">✧</span>
            </div>
            <div className="santa-reveal-details">
              <div>
                <span>FECHA DEL INTERCAMBIO</span>
                <strong>{readableExchangeDate(card.exchangeDate)}</strong>
              </div>
              <div>
                <span>PRESUPUESTO</span>
                <strong>{card.budget || "Por coordinar"}</strong>
              </div>
            </div>
            {card.notes && <p className="santa-card-notes">{card.notes}</p>}
            <button
              className="btn btn-secondary"
              onClick={() => setRevealedToken("")}
            >
              Volver a guardar el secreto
            </button>
          </>
        ) : (
          <button
            className="btn btn-forest"
            onClick={() => setRevealedToken(token)}
          >
            Descubrir mi amigo secreto <ArrowRight size={16} />
          </button>
        )}
        <small>
          <LockKeyhole size={12} /> Este enlace es privado. Guárdalo para
          consultar tu resultado.
        </small>
      </section>
    </div>
  );
}
