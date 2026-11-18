import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Gift,
  Heart,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  PlayCircle,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import ChristmasArt from "./ChristmasArt";
import { usePortal } from "../context/portal";
import {
  christmasInfo,
  downloadChristmasCalendar,
  limaDate,
} from "../lib/season";

const quickLinks = [
  {
    to: "/directorio",
    title: "¿Necesitas una mano?",
    text: "Encuentra a la persona indicada",
    icon: LifeBuoy,
    color: "blue",
  },
  {
    to: "/wiki",
    title: "Aprende y resuelve",
    text: "Guías, recursos y respuestas",
    icon: BookOpen,
    color: "green",
  },
  {
    to: "/organigrama",
    title: "Conoce a tu equipo",
    text: "Las personas que lo hacen posible",
    icon: Users,
    color: "purple",
  },
  {
    to: "/solicitudes",
    title: "Tu voz nos importa",
    text: "Comparte una solicitud o reporte",
    icon: MessageCircle,
    color: "coral",
  },
];

export function DataState({ resource, empty, compact = false }) {
  if (resource.status === "loading")
    return (
      <div className={`data-state ${compact ? "compact" : ""}`} role="status">
        <span className="loading-dots">•••</span>
        <p>Cargando novedades…</p>
      </div>
    );
  if (resource.status === "error")
    return (
      <div className={`data-state ${compact ? "compact" : ""}`} role="status">
        <span className="state-icon">
          <Megaphone size={22} />
        </span>
        <strong>No pudimos conectar</strong>
        <p>Vuelve a intentarlo para consultar la información.</p>
        <button className="text-link" onClick={resource.retry}>
          Volver a intentar <ArrowRight size={13} />
        </button>
      </div>
    );
  return (
    <div className={`data-state ${compact ? "compact" : ""}`}>
      <span className="state-icon">
        <Sparkles size={22} />
      </span>
      <strong>{empty}</strong>
      <p>Las novedades del equipo aparecerán aquí.</p>
    </div>
  );
}

export function MiniCalendar() {
  const today = limaDate();
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState(null);
  const year = month.getFullYear();
  const m = month.getMonth();
  const start = (new Date(year, m, 1).getDay() + 6) % 7;
  const total = new Date(year, m + 1, 0).getDate();
  const move = (delta) => {
    setMonth(new Date(year, m + delta, 1));
    setSelected(null);
  };
  return (
    <section className="panel calendar-panel">
      <div className="panel-heading">
        <h2>
          <CalendarDays size={17} /> Tu calendario
        </h2>
        <button
          className="text-link small"
          onClick={() => {
            setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelected(null);
          }}
        >
          Hoy
        </button>
      </div>
      <div className="calendar-month">
        <strong>
          {month.toLocaleDateString("es-PE", {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <div>
          <button
            className="icon-button"
            onClick={() => move(-1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="icon-button"
            onClick={() => move(1)}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="calendar-days">
          {Array.from({ length: start }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: total }, (_, i) => {
            const day = i + 1;
            const isToday =
              today.getDate() === day &&
              today.getMonth() === m &&
              today.getFullYear() === year;
            const christmas = m === 11 && day === 25;
            return (
              <button
                key={day}
                aria-label={`${day} de ${month.toLocaleDateString("es", { month: "long" })}${christmas ? ", Navidad" : ""}${isToday ? ", hoy" : ""}`}
                aria-pressed={selected === day}
                className={`${isToday ? "today" : ""} ${christmas ? "christmas-day" : ""} ${selected === day ? "selected" : ""}`}
                onClick={() => setSelected(day)}
              >
                {day}
                {christmas && <i />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="calendar-footnote">
        {selected ? (
          <>
            <span className="calendar-event-dot" />
            <span>
              {selected} de {month.toLocaleDateString("es", { month: "long" })}{" "}
              ·{" "}
              {m === 11 && selected === 25
                ? "¡Feliz Navidad!"
                : "Sin actividades publicadas"}
            </span>
          </>
        ) : (
          <>
            <span className="calendar-event-dot" />
            <span>25 de diciembre · Navidad</span>
          </>
        )}
      </div>
    </section>
  );
}

function NewsPanel() {
  const { news } = usePortal();
  const [filter, setFilter] = useState("Todo");
  const [expanded, setExpanded] = useState(false);
  const showSeason = filter !== "Comunicados";
  const items = news.data.filter(
    (n) =>
      filter === "Todo" ||
      (filter === "Comunicados" ? n.type === "anuncio" : n.type !== "anuncio"),
  );
  return (
    <section className="panel news-panel">
      <div className="panel-heading">
        <h2>Lo que está pasando</h2>
        <button
          className="text-link small"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Ver menos" : "Ver todo"} <ArrowRight size={14} />
        </button>
      </div>
      <div className="tabs" role="tablist" aria-label="Filtrar novedades">
        {["Todo", "Comunicados", "Cultura y equipo"].map((f) => (
          <button
            role="tab"
            aria-selected={filter === f}
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? "active" : ""}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="news-content">
        {showSeason && (
          <Link to="/navidad" className="season-news">
            <div className="season-news-art">
              <Gift size={36} strokeWidth={1.2} />
              <span aria-hidden="true">✦</span>
              <i aria-hidden="true">✧</i>
            </div>
            <div>
              <span className="category-label">
                CULTURA Y EQUIPO <span>·</span> ESPECIAL NAVIDEÑO
              </span>
              <h3>El mejor regalo es ser parte de este equipo</h3>
              <p>
                Hagamos espacio para agradecer, compartir y celebrar todo lo que
                construimos juntos.
              </p>
              <span className="text-link">
                Vivamos la Navidad <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        )}
        {(expanded ? items : items.slice(0, 3)).map((item) => (
          <article className="news-item" key={item.id}>
            <span
              className={`news-icon ${item.type === "logro" ? "gold" : "blue"}`}
            >
              {item.type === "logro" ? (
                <Trophy size={20} />
              ) : item.type === "cumpleaños" ? (
                <Gift size={20} />
              ) : (
                <Megaphone size={20} />
              )}
            </span>
            <div>
              <span className="category-label">
                {item.type === "logro"
                  ? "LOGROS"
                  : item.type === "cumpleaños"
                    ? "CELEBRAMOS"
                    : "COMUNICADO"}{" "}
                <span>·</span> {item.date}
              </span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </article>
        ))}
        {(news.status !== "ready" || items.length === 0) && (
          <DataState
            resource={news}
            compact
            empty={
              filter === "Todo"
                ? "Todo listo para las próximas novedades"
                : "Sin publicaciones en esta categoría"
            }
          />
        )}
      </div>
      <Link to="/wiki?articulo=bienvenida" className="news-bottom-link">
        <span className="small-icon">
          <BookOpen size={15} />
        </span>
        <span>
          ¿Primera vez por aquí?{" "}
          <strong>Te acompañamos en tus primeros pasos.</strong>
        </span>
        <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}

export default function Dashboard({ onWelcome }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const { year, days } = christmasInfo(now);
  const hour = Number(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const { leaderboard } = usePortal();
  return (
    <div className="dashboard page-enter">
      <div className="welcome-row">
        <div>
          <div className="eyebrow welcome-eyebrow">
            <span className="tiny-sparkle">✳</span> UN NUEVO DÍA PARA HACERLO
            JUNTOS
          </div>
          <h1>
            {greeting}, equipo{" "}
            <span className="greeting-spark" aria-hidden="true">
              ✧
            </span>
          </h1>
          <p>Tu gente, tus herramientas y un poquito de espíritu navideño.</p>
        </div>
        <div className="today-date">
          <CalendarDays size={16} />
          <span>
            {now.toLocaleDateString("es-PE", {
              timeZone: "America/Lima",
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </div>
      <section className="christmas-hero">
        <div className="hero-copy">
          <span className="season-pill">
            <span /> NAVIDAD EN GEOVICTORIA
          </span>
          <h2>
            La magia está en
            <br />
            lo que <em>hacemos juntos.</em>
          </h2>
          <p>
            Cerramos el año con gratitud, nuevas historias
            <br className="desktop-break" /> y muchas razones para celebrar en
            equipo.
          </p>
          <Link to="/navidad" className="btn btn-forest">
            Descubre nuestra Navidad <ArrowRight size={16} />
          </Link>
          <span className="hero-footnote">
            <Heart size={12} /> Cada persona hace especial este lugar.
          </span>
          <button className="welcome-replay" onClick={onWelcome}>
            <PlayCircle size={16} /> Ver saludo de VictorIA
          </button>
        </div>
        <ChristmasArt className="hero-art" />
        <span className="hero-edition">EDICIÓN NAVIDEÑA / {year}</span>
      </section>
      <section className="quick-section" aria-labelledby="quick-title">
        <div className="section-title">
          <h2 id="quick-title">A un clic de lo que necesitas</h2>
          <span>Menos vueltas. Más conexiones.</span>
        </div>
        <div className="quick-links">
          {quickLinks.map(({ to, title, text, icon: Icon, color }) => (
            <Link to={to} className="quick-card" key={to}>
              <span className={`quick-icon ${color}`}>
                <Icon size={21} strokeWidth={1.7} />
              </span>
              <ArrowUpRight className="quick-arrow" size={15} />
              <h3>{title}</h3>
              <p>{text}</p>
            </Link>
          ))}
        </div>
      </section>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <NewsPanel />
          <section className="wellbeing-card">
            <span className="coffee-illustration">
              <Coffee size={36} strokeWidth={1.4} />
              <span>✦</span>
            </span>
            <div>
              <span className="category-label">UN MOMENTO PARA TI</span>
              <h3>Respira. Desconecta. Vuelve con energía.</h3>
              <p>Una pausa pequeña puede cambiar tu día. VictorIA te espera.</p>
            </div>
            <Link to="/juego" className="btn btn-secondary">
              Hagamos una pausa <ArrowUpRight size={15} />
            </Link>
          </section>
        </div>
        <aside
          className="dashboard-secondary"
          aria-label="Calendario y comunidad"
        >
          <section className="countdown-card">
            <div className="countdown-icon">
              <Gift size={18} />
            </div>
            <span>LA CUENTA REGRESIVA MÁS BONITA</span>
            <div className="countdown-number">
              {days === 0 ? (
                "¡Hoy!"
              ) : (
                <>
                  {days}
                  <small>{days === 1 ? "día" : "días"}</small>
                </>
              )}
            </div>
            <p>
              {days === 0
                ? "¡Feliz Navidad, equipo!"
                : "para compartir la magia de Navidad"}
            </p>
            <button
              onClick={() => downloadChristmasCalendar(year)}
              className="text-link"
            >
              <ArrowDownToLine size={13} /> Guardar en mi calendario
            </button>
            <span className="countdown-star" aria-hidden="true">
              ✧
            </span>
          </section>
          <MiniCalendar />
          <section className="panel leaderboard-panel">
            <div className="panel-heading">
              <h2>
                <Trophy size={17} /> Equipo con energía
              </h2>
            </div>
            {leaderboard.data.length > 0 ? (
              <ol className="leaderboard-list">
                {leaderboard.data.map((entry, i) => (
                  <li key={entry.id}>
                    <span className={i === 0 ? "rank first" : "rank"}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{entry.name}</span>
                    <strong>
                      {Number(entry.score).toLocaleString("es-PE")}{" "}
                      <small>pts</small>
                    </strong>
                  </li>
                ))}
              </ol>
            ) : (
              <DataState
                resource={leaderboard}
                compact
                empty="El próximo récord puede ser tuyo"
              />
            )}
            <Link to="/juego" className="leaderboard-link">
              Explorar la pausa activa <ArrowRight size={14} />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
