import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  LayoutGrid,
  Megaphone,
  BookOpen,
  ChevronRight,
  Command,
  Menu,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Modal from "./Modal";
import { usePortal } from "../context/portal";
import { buildSearchIndex, portalPages, searchIndex } from "../lib/search";
import { isPublicationRead } from "../lib/news";
import { articles } from "../data/knowledge";
import AppearanceSettings from "./AppearanceSettings";

const resultIcons = {
  Secciones: LayoutGrid,
  Guías: BookOpen,
  Personas: Users,
  Publicaciones: Megaphone,
};
const routeNames = {
  ...Object.fromEntries(portalPages.map((p) => [p.path, p.title])),
  "/amigo-secreto/ver": "Tu invitación privada",
  "/buscar": "Búsqueda",
};

export default function DynamicHeader({
  isLightMode,
  toggleTheme,
  atmosphere,
  setAtmosphere,
  onMenu,
  menuOpen,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { directory, news, unreadNews, readNews, markNewsRead } = usePortal();
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const closeAppearance = useCallback(() => setAppearanceOpen(false), []);
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (menuOpen || appearanceOpen || notificationsOpen) return;
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen, appearanceOpen, notificationsOpen]);
  const index = buildSearchIndex({
    articles,
    directory: directory.data,
    news: news.data,
  });
  const matches = searchIndex(index, term);
  const results = (
    term.trim()
      ? matches
      : matches.filter((result) => result.type === "Secciones")
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
            className="icon-button navigation-trigger"
            onClick={onMenu}
            aria-label="Abrir menú de navegación"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
          >
            <Menu size={21} />
            <span>Menú</span>
          </button>
          <Link
            to="/"
            className="breadcrumb-home header-brand"
            aria-label="GeoVictoria · Inicio"
          >
            <img src="/Logo geovictoria.png" alt="" />
          </Link>
          <ChevronRight size={13} />
          <strong>
            {routeNames[location.pathname] ||
              (location.pathname.startsWith("/concurso/")
                ? "Concurso en vivo"
                : location.pathname === "/admin"
                  ? "Administración"
                  : "Página")}
          </strong>
        </div>
        <div className="topbar-actions">
          <button
            className="global-search"
            aria-label="Buscar en la intranet"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={16} />
            <span>Buscar en el portal</span>
            <kbd>
              <Command size={11} /> K
            </kbd>
          </button>
          <span className="topbar-divider" />
          <button
            className="icon-button appearance-trigger"
            onClick={() => setAppearanceOpen(true)}
            aria-label="Ajustar vista y efectos"
            title="Ajustar vista y efectos"
          >
            <SlidersHorizontal size={19} />
          </button>
          <button
            className="icon-button notification-button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Abrir novedades"
          >
            <Bell size={19} />
            {unreadNews.length > 0 && (
              <span className="unread-count" aria-hidden="true">
                {unreadNews.length > 99 ? "99+" : unreadNews.length}
              </span>
            )}
          </button>
        </div>
      </header>
      {appearanceOpen && (
        <AppearanceSettings
          isLightMode={isLightMode}
          toggleTheme={toggleTheme}
          atmosphere={atmosphere}
          setAtmosphere={setAtmosphere}
          onClose={closeAppearance}
        />
      )}
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
              placeholder="Personas, guías o publicaciones…"
            />
          </div>
          <p className="search-caption">
            {term.trim() ? `${matches.length} RESULTADOS` : "ACCESOS DIRECTOS"}
          </p>
          <div className="search-results">
            {results.map((r, i) => (
              <button key={`${r.path}-${i}`} onClick={() => go(r.path)}>
                {(() => {
                  const Icon = resultIcons[r.type];
                  return <Icon size={19} />;
                })()}
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    {r.type} · {r.detail}
                  </small>
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
          {(directory.status === "error" || news.status === "error") && (
            <p className="form-error" role="status">
              No se pudieron cargar algunos contactos o publicaciones.{" "}
              <button
                className="text-link"
                onClick={() => {
                  directory.retry();
                  news.retry();
                }}
              >
                Reintentar
              </button>
            </p>
          )}
          <button
            className="btn btn-forest search-all"
            onClick={() =>
              go(
                `/buscar${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""}`,
              )
            }
          >
            {term.trim()
              ? `Ver todos los resultados (${matches.length})`
              : "Explorar toda la intranet"}{" "}
            <ChevronRight size={16} />
          </button>
          <div className="search-hint">
            <kbd>esc</kbd> para cerrar{" "}
            <span>Tu equipo, a una búsqueda de distancia.</span>
          </div>
        </Modal>
      )}
      {notificationsOpen && (
        <Modal title="Novedades de tu equipo" onClose={closeNotifications}>
          <div className="notification-summary">
            <p>
              {unreadNews.length
                ? `${unreadNews.length} sin leer`
                : "Estás al día"}
            </p>
            {unreadNews.length > 0 && (
              <button
                className="text-link"
                onClick={() => markNewsRead(news.data)}
              >
                <CheckCheck size={15} />
                Marcar todas como leídas
              </button>
            )}
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
              {news.data.slice(0, 5).map((n) => (
                <Link
                  className="notification-item"
                  key={n.id}
                  to={`/novedades?publicacion=${encodeURIComponent(n.id)}`}
                  onClick={closeNotifications}
                >
                  <small>
                    {n.date}
                    {!isPublicationRead(n, readNews) && (
                      <span className="new-badge">Sin leer</span>
                    )}
                  </small>
                  <h3>{n.title}</h3>
                  <ChevronRight size={16} />
                </Link>
              ))}
            </div>
          )}
          <Link
            to="/novedades"
            className="btn btn-forest search-all"
            onClick={closeNotifications}
          >
            Ver todas las publicaciones <ChevronRight size={16} />
          </Link>
          <p className="local-save-caption">
            Las lecturas se guardan en este navegador.
          </p>
        </Modal>
      )}
    </>
  );
}
