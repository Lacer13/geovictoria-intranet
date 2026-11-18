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
  Sparkles,
  Shuffle,
  Users,
  X,
} from "lucide-react";

const links = [
  { to: "/", icon: Home, label: "Mi inicio", end: true },
  { to: "/organigrama", icon: Users, label: "Nuestro equipo" },
  { to: "/directorio", icon: LifeBuoy, label: "Directorio de ayuda" },
  { to: "/wiki", icon: BookOpen, label: "Centro de conocimiento" },
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
    items()[0]?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = items();
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
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
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
        onClick={(event) => {
          if (event.target.closest("a")) onClose();
        }}
        id="main-navigation"
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Menú del equipo"
      >
        <div className="sidebar-brand">
          <NavLink to="/" aria-label="GeoVictoria · Inicio">
            <img src="/Logo geovictoria.png" alt="GeoVictoria" />
          </NavLink>
          <button
            className="icon-button mobile-only"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
          <span>EL ESPACIO DE NUESTRO EQUIPO</span>
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
          <p className="nav-caption nav-caption-space">
            CONECTAMOS TAMBIÉN AQUÍ
          </p>
          <button
            type="button"
            className="nav-item victoria-video-nav"
            onClick={onWelcome}
          >
            <PlayCircle size={19} strokeWidth={1.7} />
            <span>Video de VictorIA</span>
            <span className="victoria-video-badge">Ver</span>
          </button>
          <NavLink
            to="/navidad"
            className={({ isActive }) =>
              `nav-item christmas-nav ${isActive ? "active" : ""}`
            }
          >
            <Gift size={19} strokeWidth={1.7} />
            <span>Navidad en equipo</span>
            <span className="new-badge">Especial</span>
          </NavLink>
          <NavLink
            to="/amigo-secreto"
            className={({ isActive }) =>
              `nav-item christmas-nav ${isActive ? "active" : ""}`
            }
          >
            <Shuffle size={19} strokeWidth={1.7} />
            <span>Amigo secreto</span>
            <span className="new-badge">Nuevo</span>
          </NavLink>
          <NavLink to="/juego" className="nav-item">
            <Gamepad2 size={19} strokeWidth={1.7} />
            <span>Pausa activa</span>
            <ArrowUpRight size={15} />
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={18} />
            <p>
              Lo mejor de este año
              <br />
              <strong>lo construimos juntos.</strong>
            </p>
            <span className="little-star" aria-hidden="true">
              ✧
            </span>
          </div>
          <NavLink to="/admin" className="nav-item admin-link">
            <Settings size={18} />
            <span>Administración</span>
          </NavLink>
          <div className="sidebar-profile">
            <span className="avatar">GV</span>
            <div>
              <strong>Hola, equipo</strong>
              <span>Un mismo propósito.</span>
            </div>
            <span className="online-dot" title="Tu espacio de trabajo" />
          </div>
        </div>
      </aside>
    </>
  );
}
