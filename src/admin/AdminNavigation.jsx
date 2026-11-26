import {
  Gift,
  Heart,
  Inbox,
  Megaphone,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
const icons = {
  feedbacks: Inbox,
  news: Megaphone,
  directory: Users,
  admins: ShieldCheck,
  santa: Gift,
  quiz: Trophy,
  wall: Heart,
  scores: Trophy,
};
export default function AdminNavigation({ modules, current, onChange }) {
  return (
    <>
      <label className="admin-section-select">
        Sección de administración
        <select
          value={current}
          onChange={(event) => onChange(event.target.value)}
        >
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.label}
            </option>
          ))}
        </select>
      </label>
      <nav className="admin-tabs" aria-label="Secciones de administración">
        {modules.map((module) => {
          const Icon = icons[module.id];
          return (
            <button
              key={module.id}
              className={`btn ${current === module.id ? "btn-forest" : "btn-secondary"}`}
              aria-pressed={current === module.id}
              onClick={() => onChange(module.id)}
            >
              <Icon size={18} /> {module.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
