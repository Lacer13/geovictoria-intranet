import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  Copy,
  Gift,
  Heart,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import ChristmasArt from "./ChristmasArt";
import QRCodeSection from "./QRCodeSection";
import { christmasInfo, downloadChristmasCalendar } from "../lib/season";
import { readPreference, savePreference } from "../lib/preferences";

const ideas = [
  {
    id: "gracias",
    title: "Regala un gracias",
    text: "Piensa en alguien que hizo tu año más fácil. Un mensaje pequeño puede significar mucho.",
  },
  {
    id: "conecta",
    title: "Haz espacio para conectar",
    text: "Comparte un café o una conversación con alguien con quien no sueles coincidir.",
  },
  {
    id: "comparte",
    title: "Comparte algo que aprendiste",
    text: "Una recomendación o una buena idea puede ser el mejor regalo para otra persona.",
  },
];
function loadIdeas() {
  try {
    const v = JSON.parse(readPreference("geoChristmasIdeas", "[]"));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export default function Christmas() {
  const { days, year } = christmasInfo();
  const [done, setDone] = useState(loadIdeas);
  const [name, setName] = useState("");
  const [message, setMessage] = useState(
    "Gracias por tu apoyo, tu energía y por hacer de este equipo un lugar especial. ¡Que tengas una Navidad llena de buenos momentos!",
  );
  const toggle = (id) => {
    const next = done.includes(id)
      ? done.filter((v) => v !== id)
      : [...done, id];
    setDone(next);
    savePreference("geoChristmasIdeas", JSON.stringify(next));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${name.trim() ? `Para ${name.trim()}:\n\n` : ""}${message.trim()}\n\nCon cariño, tu equipo GeoVictoria ✨`,
      );
      toast.success("Tu saludo está listo para compartir");
    } catch {
      toast.error(
        "No pudimos copiar el saludo. Puedes seleccionar el texto y copiarlo.",
      );
    }
  };
  return (
    <div className="page-enter">
      <div className="page-heading">
        <span className="eyebrow">ESPECIAL NAVIDEÑO · {year}</span>
        <h1>La mejor parte del año es compartirlo.</h1>
        <p>
          Un espacio para agradecer a las personas que hacen especial nuestro
          día a día.
        </p>
      </div>
      <section className="christmas-hero christmas-page-hero">
        <div className="hero-copy">
          <span className="season-pill">
            <span /> NAVIDAD EN EQUIPO
          </span>
          <h2>
            Más que un equipo,
            <br />
            <em>muchas historias juntas.</em>
          </h2>
          <p>
            El mejor regalo es todo lo que construimos
            <br className="desktop-break" /> cuando conectamos, nos cuidamos y
            compartimos.
          </p>
          <div className="christmas-hero-count">
            <Gift size={20} />
            <span>
              {days === 0 ? (
                "¡Hoy celebramos la Navidad!"
              ) : (
                <>
                  <strong>
                    {days} {days === 1 ? "día" : "días"}
                  </strong>{" "}
                  para Navidad
                </>
              )}
            </span>
          </div>
          <button
            className="text-link"
            onClick={() => downloadChristmasCalendar(year)}
          >
            <ArrowDownToLine size={14} /> Añadir el 25 de diciembre a mi
            calendario
          </button>
        </div>
        <ChristmasArt className="hero-art" />
        <span className="hero-edition">CON GRATITUD, GEOVICTORIA</span>
      </section>
      <div className="section-title christmas-section-title">
        <div>
          <span className="eyebrow">LA MAGIA EMPIEZA EN LO PEQUEÑO</span>
          <h2>Tres formas de regalar un buen momento</h2>
        </div>
        <span>Ideas para ti · {done.length}/3 completadas</span>
      </div>
      <div className="christmas-ideas">
        {ideas.map((idea, i) => (
          <article
            key={idea.id}
            className={`panel idea-card ${done.includes(idea.id) ? "completed" : ""}`}
          >
            <div className="idea-top">
              <span>0{i + 1}</span>
              <Sparkles size={23} />
            </div>
            <h3>{idea.title}</h3>
            <p>{idea.text}</p>
            <button
              className="text-link"
              onClick={() => toggle(idea.id)}
              aria-pressed={done.includes(idea.id)}
            >
              {done.includes(idea.id) ? (
                <>
                  <Check size={16} /> Un buen momento compartido
                </>
              ) : (
                <>
                  Me sumo a esta idea <ArrowRight size={15} />
                </>
              )}
            </button>
          </article>
        ))}
      </div>
      <p className="local-save-caption">
        Tus ideas completadas se guardan en este navegador. Son propuestas
        personales; no son actividades programadas por la empresa.
      </p>
      <section className="panel greeting-builder">
        <div>
          <span className="quick-icon coral">
            <Heart size={23} />
          </span>
          <span className="eyebrow">PALABRAS QUE ACERCAN</span>
          <h2>Un gracias también es un regalo.</h2>
          <p>
            Prepara un saludo, dale tu toque y compártelo con esa persona que
            hizo la diferencia.
          </p>
          <div className="input-group">
            <label htmlFor="greeting-name">
              ¿A quién va dirigido? <span className="muted">(opcional)</span>
            </label>
            <input
              id="greeting-name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="El nombre de alguien especial en tu equipo"
            />
          </div>
          <div className="input-group">
            <label htmlFor="greeting-text">Tu mensaje</label>
            <textarea
              id="greeting-text"
              className="input-field"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
            />
          </div>
          <button
            className="btn btn-forest"
            disabled={!message.trim()}
            onClick={copy}
          >
            <Copy size={16} /> Copiar mi saludo
          </button>
          <small className="greeting-privacy">
            Tu saludo se prepara aquí y lo compartes tú.
          </small>
        </div>
        <div className="greeting-preview">
          <span className="greeting-preview-star">✧</span>
          <span className="eyebrow">UN DETALLE PARA TI</span>
          <h3>{name.trim() ? `Para ${name.trim()}` : "Querido equipo,"}</h3>
          <p>{message || "Tu mensaje aparecerá aquí…"}</p>
          <span className="greeting-signature">
            Con cariño,
            <br />
            <strong>tu equipo GeoVictoria</strong>
          </span>
          <span className="greeting-preview-sprig" aria-hidden="true">
            ✳
          </span>
        </div>
      </section>
      <QRCodeSection />
      <div className="help-banner">
        <Sparkles size={22} />
        <div>
          <strong>¿Tienes una idea para celebrar en equipo?</strong>
          <p>Nos encantará conocer tu propuesta.</p>
        </div>
        <Link to="/solicitudes" className="text-link">
          Compartir mi idea <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
