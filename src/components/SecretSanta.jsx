import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Heart,
  Link2,
  LockKeyhole,
} from "lucide-react";
import {
  CARD_PATTERN,
  readPrivateSantaToken,
  readableExchangeDate,
} from "../lib/secretSanta";
import { getSantaCard } from "../lib/secretSantaStore";

export default function SecretSanta() {
  const navigate = useNavigate();
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitation, setInvitation] = useState("");
  const [error, setError] = useState("");
  const openInvitation = (e) => {
    e.preventDefault();
    const token = readPrivateSantaToken(invitation, window.location.origin);
    if (!token) {
      setError(
        "Pega el enlace completo de esta intranet que te compartió la organización.",
      );
      return;
    }
    navigate(`/amigo-secreto/ver#${token}`);
  };
  return (
    <div className="page-enter santa-public">
      <div className="page-heading">
        <h1>Amigo secreto</h1>
      </div>
      <section className="santa-welcome">
        <div>
          <h2>
            Tu próxima <em>sorpresa.</em>
          </h2>
          <p>Abre tu enlace personal y descubre a quién le regalarás.</p>
          <div className="santa-welcome-actions">
            <button
              className="btn btn-forest"
              onClick={() => setInvitationOpen((value) => !value)}
              aria-expanded={invitationOpen}
              aria-controls="santa-invitation-panel"
            >
              <Gift size={16} /> Abrir mi invitación
            </button>
            <Link
              className="btn btn-secondary"
              to="/admin?seccion=amigo-secreto"
            >
              Organizar un sorteo <ArrowRight size={16} />
            </Link>
          </div>
          <small>
            <LockKeyhole size={12} /> Tu enlace es privado. No lo compartas.
          </small>
        </div>
        <div className="santa-gift-art" aria-hidden="true">
          <span>✧</span>
          <Gift size={120} strokeWidth={0.8} />
          <i>✦</i>
          <Heart size={25} />
        </div>
      </section>
      {invitationOpen && (
        <section
          className="panel santa-open-invitation"
          id="santa-invitation-panel"
          aria-label="Abrir una invitación privada"
        >
          <div>
            <Link2 size={23} />
            <h2>Pega tu invitación</h2>
          </div>
          <form onSubmit={openInvitation}>
            <label htmlFor="santa-invitation-url">Tu enlace privado</label>
            <div>
              <input
                id="santa-invitation-url"
                type="url"
                className="input-field"
                placeholder={`${window.location.origin}/amigo-secreto/ver#…`}
                value={invitation}
                onChange={(e) => {
                  setInvitation(e.target.value);
                  setError("");
                }}
                autoFocus
                required
                autoComplete="off"
                aria-describedby={error ? "santa-invitation-error" : undefined}
                aria-invalid={!!error}
              />
              <button className="btn btn-forest" type="submit">
                Abrir invitación <ArrowRight size={15} />
              </button>
            </div>
            {error && (
              <p
                className="form-error"
                role="alert"
                id="santa-invitation-error"
              >
                {error}
              </p>
            )}
          </form>
          <small>¿No lo tienes? Pide a la organización que lo reenvíe.</small>
        </section>
      )}
      <section className="santa-help" aria-labelledby="santa-help-title">
        <h2 id="santa-help-title">Ayuda con tu invitación</h2>
        <details className="disclosure panel">
          <summary>¿Dónde encuentro mi enlace?</summary>
          <div className="disclosure-body">
            <p>
              La organización puede compartirlo contigo por mensaje o correo.
              Abre ese enlace directamente o pégalo en «Abrir mi invitación». No
              necesitas crear una cuenta.
            </p>
          </div>
        </details>
        <details className="disclosure panel">
          <summary>¿Puedo volver a ver mi resultado?</summary>
          <div className="disclosure-body">
            <p>
              Sí. Guarda tu enlace para consultarlo cuando quieras. Solo quien
              tenga ese enlace puede ver tu asignación.
            </p>
          </div>
        </details>
        <details className="disclosure panel">
          <summary>Perdí mi invitación</summary>
          <div className="disclosure-body">
            <p>
              La organización puede recuperar tu enlace o reenviar el correo.
            </p>
            <Link to="/directorio" className="text-link">
              Contactar al equipo <ArrowRight size={15} />
            </Link>
          </div>
        </details>
      </section>
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
