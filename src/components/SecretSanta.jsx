import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  EyeOff,
  Gift,
  Heart,
  Link2,
  LockKeyhole,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  CARD_PATTERN,
  privateSantaLink,
  readPrivateSantaToken,
  readableExchangeDate,
} from "../lib/secretSanta";
import { getSantaCard } from "../lib/secretSantaStore";
import "../secret-santa-experience.css";
import SantaGreetingBoundary from "./secretSanta/SantaGreetingBoundary";

const SantaGreeting = lazy(() => import("./secretSanta/SantaGreeting"));

export default function SecretSanta() {
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState("");
  const [error, setError] = useState("");
  const invitationInput = useRef(null);
  const openInvitation = (e) => {
    e.preventDefault();
    const token = readPrivateSantaToken(invitation, window.location.origin);
    if (!token) {
      setError(
        "Pega el enlace completo que te compartieron, incluido el código que aparece después de #.",
      );
      invitationInput.current?.focus();
      return;
    }
    navigate(`/amigo-secreto/ver#${token}`);
  };
  return (
    <div className="page-enter santa-public santa-experience">
      <section className="santa-entry" aria-labelledby="santa-entry-title">
        <div className="santa-entry-story">
          <span className="santa-kicker">
            <Sparkles size={15} /> UN DETALLE NOS ACERCA
          </span>
          <h1 id="santa-entry-title">
            Un regalo.
            <br />
            Una sonrisa.
            <br /> <em>Un secreto.</em>
          </h1>
          <p>
            La sorpresa empieza contigo. Descubre a quién le regalarás y prepara
            un detalle con cariño.
          </p>
          <span className="santa-entry-signature">
            <Heart size={16} /> Amigo secreto · GeoVictoria
          </span>
          <div className="santa-entry-decoration" aria-hidden="true">
            <Gift size={116} strokeWidth={1} />
            <span>✧</span>
            <i>✦</i>
          </div>
        </div>
        <div className="santa-entry-form">
          <span className="santa-form-icon">
            <Link2 size={25} />
          </span>
          <span className="santa-kicker">TU INVITACIÓN PERSONAL</span>
          <h2>Tu sorpresa te espera</h2>
          <p>
            Pega el enlace que recibiste por mensaje o correo. No necesitas una
            cuenta.
          </p>
          <form onSubmit={openInvitation} noValidate>
            <label htmlFor="santa-invitation-url">
              Enlace de tu invitación
            </label>
            <input
              ref={invitationInput}
              id="santa-invitation-url"
              type="url"
              inputMode="url"
              className="input-field"
              placeholder="Pega aquí tu enlace personal"
              value={invitation}
              onChange={(e) => {
                setInvitation(e.target.value);
                setError("");
              }}
              required
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby={
                error ? "santa-invitation-error" : "santa-invitation-help"
              }
              aria-invalid={!!error}
            />
            {error && (
              <p
                className="form-error"
                role="alert"
                id="santa-invitation-error"
              >
                {error}
              </p>
            )}
            <button className="btn btn-forest" type="submit">
              Abrir mi invitación <ArrowRight size={17} />
            </button>
          </form>
          <small id="santa-invitation-help">
            <LockKeyhole size={14} /> Solo quien tenga tu enlace puede ver tu
            resultado.
          </small>
          <a
            href="#santa-invitation-help-title"
            className="text-link santa-entry-help"
          >
            ¿No encuentras tu enlace?
          </a>
        </div>
      </section>
      <ol className="santa-participant-steps" aria-label="Cómo participar">
        {[
          [
            Link2,
            "Abre tu invitación",
            "Usa el enlace personal que te compartieron.",
          ],
          [
            Gift,
            "Descubre tu sorpresa",
            "Conoce a quién le regalarás y los detalles.",
          ],
          [
            Heart,
            "Prepara un buen momento",
            "Elige tu detalle y conserva el secreto.",
          ],
        ].map(([Icon, title, text], index) => (
          <li key={title}>
            <span>
              <Icon size={21} />
            </span>
            <div>
              <small>PASO 0{index + 1}</small>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="santa-public-support">
        <section
          className="santa-help"
          aria-labelledby="santa-invitation-help-title"
        >
          <h2 id="santa-invitation-help-title">Un poco de ayuda</h2>
          <details className="disclosure panel">
            <summary>No encuentro mi invitación</summary>
            <div className="disclosure-body">
              <p>
                Busca el mensaje o correo de la organización. Si no lo
                encuentras, pide que te compartan de nuevo tu enlace personal.
                Tu asignación seguirá siendo la misma.
              </p>
              <Link to="/directorio" className="text-link">
                Contactar al equipo <ArrowRight size={15} />
              </Link>
            </div>
          </details>
          <details className="disclosure panel">
            <summary>¿Puedo volver a consultar mi resultado?</summary>
            <div className="disclosure-body">
              <p>
                Sí. Guarda tu enlace y ábrelo cuando lo necesites. Si la
                organización archiva el sorteo, el enlace dejará de estar
                disponible.
              </p>
            </div>
          </details>
          <details className="disclosure panel">
            <summary>¿Quién puede ver mi amigo secreto?</summary>
            <div className="disclosure-body">
              <p>
                Quien tenga tu enlace podrá consultar tu asignación. Guárdalo en
                un lugar privado. La organización tiene acceso al respaldo para
                ayudarte si lo necesitas.
              </p>
            </div>
          </details>
        </section>
        <aside className="santa-organizer-card">
          <span className="santa-form-icon">
            <Gift size={25} />
          </span>
          <span className="santa-kicker">PARA QUIEN ORGANIZA</span>
          <h2>
            Reúne al equipo.
            <br />
            Nosotros ponemos el azar.
          </h2>
          <p>
            Prepara tu grupo, realiza el sorteo y comparte una invitación con
            cada persona.
          </p>
          <Link className="btn btn-secondary" to="/admin?seccion=amigo-secreto">
            Organizar un intercambio <ArrowRight size={16} />
          </Link>
          <small>Acceso para administradores autorizados.</small>
        </aside>
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
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const recoveryInput = useRef(null);
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
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timer);
  }, [copied]);
  useEffect(() => {
    if (copyFailed) recoveryInput.current?.select();
  }, [copyFailed]);
  const copyInvitation = async () => {
    try {
      await navigator.clipboard.writeText(
        privateSantaLink(window.location.origin, token),
      );
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  };
  if (!valid || (result.token === token && result.error))
    return (
      <section className="panel santa-reveal santa-missing santa-experience">
        <span className="santa-form-icon">
          <Link2 size={28} />
        </span>
        <span className="santa-kicker">VAMOS A ENCONTRAR TU INVITACIÓN</span>
        <h1>No pudimos abrir tu enlace</h1>
        <p>
          {valid
            ? "Puede haber un problema de conexión o el sorteo puede estar archivado. Prueba de nuevo; si continúa, consulta con la organización."
            : "Parece que falta una parte del enlace. Copia el mensaje completo que recibiste o pide a la organización que te lo comparta de nuevo."}
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
        <Link
          to="/amigo-secreto"
          className={valid ? "text-link" : "btn btn-forest"}
        >
          Buscar mi invitación <ArrowRight size={15} />
        </Link>
      </section>
    );
  if (result.token !== token)
    return (
      <div className="route-loading" role="status">
        <Gift className="animate-float" /> Preparando tu sorpresa…
      </div>
    );
  const card = result.data;
  const revealed = revealedToken === token;
  const greetingFallback = (
    <span className="santa-reveal-emblem" aria-hidden="true">
      <Gift size={49} strokeWidth={1.2} />
      <i>✦</i>
    </span>
  );
  return (
    <div className="santa-reveal-page page-enter santa-experience">
      <Link to="/amigo-secreto" className="text-link back-link">
        <ArrowLeft size={15} /> Amigo secreto
      </Link>
      <section
        className={`panel santa-reveal santa-reveal-card ${revealed ? "is-revealed" : ""}`}
        aria-labelledby="santa-personal-title"
      >
        <span className="santa-kicker">
          <LockKeyhole size={13} /> SOLO PARA TI
        </span>
        <SantaGreetingBoundary key={token} fallback={greetingFallback}>
          <Suspense fallback={greetingFallback}>
            <SantaGreeting />
          </Suspense>
        </SantaGreetingBoundary>
        <h1 id="santa-personal-title">Hola, {card.giverName}.</h1>
        <p>
          {revealed
            ? "Un detalle tuyo le alegrará el día a…"
            : "Hay una persona a la que puedes sacarle una sonrisa. ¿Descubrimos quién es?"}
        </p>
        {revealed ? (
          <>
            <div className="santa-recipient" role="status">
              <span aria-hidden="true">✧</span>
              <div>
                <small>TU REGALO ES PARA</small>
                <strong>{card.recipientName}</strong>
              </div>
              <span aria-hidden="true">✧</span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setRevealedToken("")}
            >
              <EyeOff size={16} /> Ocultar mi resultado
            </button>
          </>
        ) : (
          <button
            className="btn btn-forest santa-reveal-button"
            onClick={() => setRevealedToken(token)}
          >
            <Gift size={18} /> Descubrir mi amigo secreto{" "}
            <ArrowRight size={16} />
          </button>
        )}
        <small>
          <LockKeyhole size={13} /> Conserva la sorpresa. Tu enlace es personal.
        </small>
      </section>
      <section
        className="panel santa-event-details"
        aria-labelledby="santa-event-title"
      >
        <div className="santa-event-details-heading">
          <span className="santa-kicker">NOS ENCONTRAMOS PARA CELEBRAR</span>
          <h2 id="santa-event-title">{card.title}</h2>
        </div>
        <div className="santa-reveal-details">
          <div>
            <CalendarDays size={20} />
            <div>
              <span>Fecha del intercambio</span>
              <strong>{readableExchangeDate(card.exchangeDate)}</strong>
            </div>
          </div>
          <div>
            <Wallet size={20} />
            <div>
              <span>Presupuesto del regalo</span>
              <strong>{card.budget || "Por coordinar"}</strong>
            </div>
          </div>
        </div>
        {card.notes && (
          <div className="santa-event-notes">
            <h3>De parte de la organización</h3>
            <p>{card.notes}</p>
          </div>
        )}
      </section>
      <aside className="santa-keep-invitation">
        <div>
          <Link2 size={21} />
          <div>
            <h2>Vuelve cuando quieras</h2>
            <p>
              Copia tu enlace y guárdalo en un lugar privado para consultar de
              nuevo tu resultado.
            </p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={copyInvitation}>
          {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
          {copied ? "Enlace copiado" : "Copiar mi enlace"}
        </button>
        <span className="santa-sr-only" role="status">
          {copied ? "Tu enlace personal se copió al portapapeles." : ""}
        </span>
        {copyFailed && (
          <div className="santa-copy-fallback">
            <label htmlFor="santa-recovery-link">
              Selecciona y copia tu enlace
            </label>
            <input
              ref={recoveryInput}
              id="santa-recovery-link"
              className="input-field"
              readOnly
              value={privateSantaLink(window.location.origin, token)}
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
