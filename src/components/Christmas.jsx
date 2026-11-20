import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  Gift,
  Sparkles,
} from "lucide-react";
import ChristmasWall from "./ChristmasWall";
import ChristmasArt from "./ChristmasArt";
import QRCodeSection from "./QRCodeSection";
import { christmasInfo, downloadChristmasCalendar } from "../lib/season";
import { readPreference, savePreference } from "../lib/preferences";

const ideas = [
  {
    id: "gracias",
    title: "Regala un gracias",
    text: "Agradece a alguien que te ayudó este año.",
  },
  {
    id: "conecta",
    title: "Comparte un café",
    text: "Conversa con alguien de otra área.",
  },
  {
    id: "comparte",
    title: "Regala una idea",
    text: "Comparte un recurso que te haya servido.",
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
  const toggle = (id) => {
    const next = done.includes(id)
      ? done.filter((v) => v !== id)
      : [...done, id];
    setDone(next);
    savePreference("geoChristmasIdeas", JSON.stringify(next));
  };
  return (
    <div className="page-enter">
      <div className="page-heading">
        <span className="eyebrow">ESPECIAL NAVIDEÑO · {year}</span>
        <h1>Navidad en equipo</h1>
      </div>
      <section className="christmas-hero christmas-page-hero compact-season-hero">
        <div className="hero-copy">
          <h2>
            Compartamos <em>la magia.</em>
          </h2>
          <p>Un saludo, un café o un regalo para alguien del equipo.</p>
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
          <div className="season-actions">
            <Link to="/amigo-secreto" className="btn btn-forest">
              <Gift size={16} /> Amigo secreto
            </Link>
            <button
              className="text-link"
              onClick={() => downloadChristmasCalendar(year)}
            >
              <ArrowDownToLine size={14} /> Guardar fecha
            </button>
          </div>
        </div>
        <ChristmasArt className="hero-art" />
      </section>
      <ChristmasWall />
      <details className="disclosure panel seasonal-disclosure">
        <summary>
          <Sparkles size={21} />
          <span>
            Ideas para celebrar<small>{done.length}/3 completadas</small>
          </span>
        </summary>
        <div className="disclosure-body">
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
                      <Check size={16} /> Completado
                    </>
                  ) : (
                    <>
                      Marcar como hecho <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </article>
            ))}
          </div>
          <p className="local-save-caption">
            Ideas personales. Tu avance se guarda en este navegador.
          </p>
        </div>
      </details>
      <details className="disclosure panel seasonal-disclosure">
        <summary>
          <ArrowRight size={21} />
          <span>
            Abrir en mi celular<small>Escanea o comparte el QR</small>
          </span>
        </summary>
        <QRCodeSection />
      </details>
      <Link to="/solicitudes" className="text-link seasonal-suggestion">
        Proponer una actividad <ArrowRight size={15} />
      </Link>
    </div>
  );
}
