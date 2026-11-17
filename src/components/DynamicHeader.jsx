import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Command,
  Gift,
  Menu,
  Moon,
  Search,
  Snowflake,
  Sun,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Modal from "./Modal";
import { usePortal } from "../context/portal";
import { normalize } from "../lib/preferences";
import { articles } from "../data/knowledge";

const pages = [
  {
    title: "Mi inicio",
    detail: "Tu espacio de trabajo",
    path: "/",
    icon: Search,
  },
  {
    title: "Nuestro equipo",
    detail: "Organigrama y áreas",
    path: "/organigrama",
    icon: Users,
  },
  {
    title: "Directorio de ayuda",
    detail: "Personas y contactos",
    path: "/directorio",
    icon: Users,
  },
  {
    title: "Centro de conocimiento",
    detail: "Guías y recursos",
    path: "/wiki",
    icon: BookOpen,
  },
  {
    title: "Te escuchamos",
    detail: "Solicitudes y reportes",
    path: "/solicitudes",
    icon: BookOpen,
  },
  {
    title: "Navidad en equipo",
    detail: "Nuestro especial navideño",
    path: "/navidad",
    icon: Gift,
  },
  {
    title: "Amigo secreto",
    detail: "Sorteo navideño, invitación y regalos",
    path: "/amigo-secreto",
    icon: Gift,
  },
  {
    title: "Pausa activa",
    detail: "Un respiro con VictorIA",
    path: "/juego",
    icon: Gift,
  },
];
const routeNames = {
  ...Object.fromEntries(pages.map((p) => [p.path, p.title])),
  "/amigo-secreto/ver": "Tu invitación privada",
};

export default function DynamicHeader({
  isLightMode,
  toggleTheme,
  festive,
  toggleFestive,
  onMenu,
  menuOpen,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { directory, news } = usePortal();
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);
  const allResults = [
    ...pages,
    ...articles.map((a) => ({
      title: a.title,
      detail: a.category,
      path: `/wiki?articulo=${a.id}`,
      icon: BookOpen,
    })),
    ...directory.data.map((c) => ({
      title: c.name,
      detail: c.department,
      path: `/directorio?q=${encodeURIComponent(c.name)}`,
      icon: Users,
    })),
  ];
  const results = (
    term.trim()
      ? allResults.filter((r) =>
          normalize(`${r.title} ${r.detail}`).includes(normalize(term)),
        )
      : pages
  ).slice(0, 8);
  const go = (path) => {
    setSearchOpen(false);
    setTerm("");
    navigate(path);
  };
  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">
          <button
            className="icon-button mobile-only"
            onClick={onMenu}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
          >
            <Menu size={21} />
          </button>
          <span className="breadcrumb-home">Nuestro espacio</span>
          <ChevronRight size={13} />
          <strong>
            {routeNames[location.pathname] ||
              (location.pathname === "/admin" ? "Administración" : "Página")}
          </strong>
        </div>
        <div className="topbar-actions">
          <button
            className="global-search"
            aria-label="Buscar en la intranet"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={16} />
            <span>¿Qué estás buscando?</span>
            <kbd>
              <Command size={11} /> K
            </kbd>
          </button>
          <span className="topbar-divider" />
          <button
            className={`icon-button festive-toggle ${festive ? "enabled" : ""}`}
            onClick={toggleFestive}
            aria-label={
              festive
                ? "Pausar animaciones navideñas"
                : "Activar animaciones navideñas"
            }
            aria-pressed={festive}
            title={
              festive
                ? "Pausar animaciones navideñas"
                : "Activar animaciones navideñas"
            }
          >
            <Snowflake size={18} />
          </button>
          <button
            className="icon-button theme-button"
            onClick={toggleTheme}
            aria-label={
              isLightMode ? "Activar modo oscuro" : "Activar modo claro"
            }
          >
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            className="icon-button notification-button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Abrir novedades"
          >
            <Bell size={19} />
            {news.data.length > 0 && <span />}
          </button>
          <span
            className="avatar header-avatar"
            aria-label="Equipo GeoVictoria"
          >
            GV
          </span>
        </div>
      </header>
      {searchOpen && (
        <Modal
          title="Encuentra lo que necesitas"
          onClose={closeSearch}
          className="search-modal"
        >
          <div className="search-field">
            <Search size={19} />
            <input
              data-autofocus
              aria-label="Buscar en la intranet"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Personas, herramientas, guías…"
            />
          </div>
          <p className="search-caption">
            {term ? "RESULTADOS" : "EXPLORA TU INTRANET"}
          </p>
          <div className="search-results">
            {results.map((r, i) => (
              <button key={`${r.path}-${i}`} onClick={() => go(r.path)}>
                <r.icon size={19} />
                <span>
                  <strong>{r.title}</strong>
                  <small>{r.detail}</small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
            {results.length === 0 && (
              <div className="empty-state">
                <Search />
                <p>No encontramos resultados para “{term}”.</p>
                <span>Prueba con otra palabra o visita el directorio.</span>
                <button
                  className="text-link"
                  onClick={() =>
                    go(`/directorio?q=${encodeURIComponent(term)}`)
                  }
                >
                  Buscar en el directorio →
                </button>
              </div>
            )}
          </div>
          <div className="search-hint">
            <kbd>esc</kbd> para cerrar{" "}
            <span>Tu equipo, a una búsqueda de distancia.</span>
          </div>
        </Modal>
      )}
      {notificationsOpen && (
        <Modal title="Novedades de tu equipo" onClose={closeNotifications}>
          <div className="notification-season">
            <Gift size={24} />
            <div>
              <strong>Ya se siente la Navidad</strong>
              <p>Descubre nuestro espacio para celebrar juntos.</p>
              <Link
                to="/navidad"
                onClick={closeNotifications}
                className="text-link"
              >
                Ver especial navideño →
              </Link>
            </div>
          </div>
          {news.status === "loading" ? (
            <p className="muted">Buscando las últimas publicaciones…</p>
          ) : news.status === "error" ? (
            <div className="empty-state">
              <p>No pudimos cargar los comunicados.</p>
              <button className="text-link" onClick={news.retry}>
                Volver a intentar
              </button>
            </div>
          ) : news.data.length === 0 ? (
            <p className="muted">Estás al día. No hay nuevos comunicados.</p>
          ) : (
            <div className="notification-list">
              {news.data.slice(0, 8).map((n) => (
                <article key={n.id}>
                  <small>{n.date}</small>
                  <h3>{n.title}</h3>
                  <p>{n.desc}</p>
                </article>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
