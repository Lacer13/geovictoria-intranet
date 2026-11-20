import { NavLink } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Gamepad2,
  Gift,
  Home,
  LifeBuoy,
  PlayCircle,
  MessageSquare,
  Settings,
  Shuffle,
  Trophy,
  Users,
  X,
} from "lucide-react";

const links = [
  { to: "/", icon: Home, label: "Mi inicio", end: true },
  { to: "/organigrama", icon: Users, label: "Nuestro equipo" },
  { to: "/directorio", icon: LifeBuoy, label: "Directorio de ayuda" },
  { to: "/wiki", icon: BookOpen, label: "Guías y recursos" },
  { to: "/solicitudes", icon: MessageSquare, label: "Te escuchamos" },
];
export default function Sidebar({ open, onClose, onWelcome }) {
  const drawer = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const items = () =>
      [...drawer.current.querySelectorAll("a, button")].filter(
        (el) => el.getClientRects().length,
      );
    const focusFrame = requestAnimationFrame(() =>
      drawer.current
        ?.querySelector(".sidebar-close")
        ?.focus({ preventScroll: true }),
    );
    const key = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const list = items();
        if (!drawer.current.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? list.at(-1) : list[0])?.focus({ preventScroll: true });
          return;
        }
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus({ preventScroll: true });
    };
  }, [open, onClose]);
  return (
    <>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar navegación"
          onClick={onClose}
        />
      )}
      <aside
        ref={drawer}
        onTransitionEnd={(event) => {
          if (
            open &&
            event.target === event.currentTarget &&
            !drawer.current.contains(document.activeElement)
          )
            drawer.current
              .querySelector(".sidebar-close")
              ?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          if (event.target.closest("a")) onClose();
        }}
        id="main-navigation"
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Menú del equipo"
        role="dialog"
        aria-modal={open || undefined}
        aria-hidden={!open}
        inert={!open || undefined}
      >
        <div className="sidebar-brand">
          <NavLink to="/" aria-label="GeoVictoria · Inicio">
            <img src="/Logo geovictoria.png" alt="GeoVictoria" />
          </NavLink>
          <button
            className="icon-button sidebar-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="peru-flag" aria-hidden="true" />
          <span>GeoVictoria Perú</span>
          <span className="workspace-badge">Navidad</span>
        </div>
        <nav aria-label="Navegación principal">
          <p className="nav-caption">TU DÍA A DÍA</p>
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              <ChevronRight className="nav-chevron" size={14} />
            </NavLink>
          ))}
          <p className="nav-caption nav-caption-space">NAVIDAD Y COMUNIDAD</p>
          <button
            type="button"
            className="nav-item victoria-video-nav"
            onClick={onWelcome}
          >
            <PlayCircle size={19} strokeWidth={1.7} />
            <span>Video de VictorIA</span>
          </button>
          <NavLink
            to="/navidad"
            className={({ isActive }) =>
              `nav-item christmas-nav ${isActive ? "active" : ""}`
            }
          >
            <Gift size={19} strokeWidth={1.7} />
            <span>Navidad en equipo</span>
          </NavLink>
          <NavLink
            to="/amigo-secreto"
            className={({ isActive }) =>
              `nav-item christmas-nav ${isActive ? "active" : ""}`
            }
          >
            <Shuffle size={19} strokeWidth={1.7} />
            <span>Amigo secreto</span>
          </NavLink>
          <NavLink
            to="/concurso"
            className={({ isActive }) =>
              `nav-item christmas-nav ${isActive ? "active" : ""}`
            }
          >
            <Trophy size={19} strokeWidth={1.7} />
            <span>Concurso en vivo</span>
          </NavLink>
          <NavLink to="/juego" className="nav-item">
            <Gamepad2 size={19} strokeWidth={1.7} />
            <span>Pausa activa</span>
            <ArrowUpRight size={15} />
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/admin" className="nav-item admin-link">
            <Settings size={18} />
            <span>Administración</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
