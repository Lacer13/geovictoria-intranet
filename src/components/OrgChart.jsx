import { Link } from "react-router-dom";
import { ArrowRight, Building2, Network, Users } from "lucide-react";
import { usePortal } from "../context/portal";
import { DataState } from "./Dashboard";

export default function OrgChart() {
  const { directory } = usePortal();
  const groups = Object.entries(
    directory.data.reduce((all, c) => {
      const key = c.department || "Equipo";
      (all[key] ||= []).push(c);
      return all;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b, "es"));
  return (
    <div className="page-enter">
      <div className="page-heading">
        <span className="eyebrow">MUCHAS PERSONAS. UN MISMO PROPÓSITO.</span>
        <h1>Conoce a quienes lo hacen posible.</h1>
        <p>Explora nuestras áreas y encuentra sus contactos de referencia.</p>
      </div>
      <section className="team-intro">
        <div className="team-emblem">
          <Network size={38} strokeWidth={1.3} />
        </div>
        <div>
          <span className="eyebrow">GEOVICTORIA PERÚ</span>
          <h2>Un equipo que conecta equipos.</h2>
          <p>La colaboración empieza por saber con quién contar.</p>
        </div>
        <span className="team-stat">
          <strong>{groups.length}</strong> áreas publicadas
        </span>
      </section>
      <div className="inline-notice">
        <Building2 size={17} />
        <span>
          Vista por áreas basada en el directorio vigente. Los contactos no
          implican una relación de jefatura.
        </span>
      </div>
      {directory.status !== "ready" && (
        <section className="panel">
          <DataState resource={directory} />
        </section>
      )}
      <div className="team-grid">
        {groups.map(([department, people], i) => (
          <section className="panel team-card" key={department}>
            <span
              className={`quick-icon ${["blue", "green", "purple", "coral"][i % 4]}`}
            >
              <Users size={22} />
            </span>
            <h2>{department}</h2>
            <p className="muted">
              {people.length}{" "}
              {people.length === 1
                ? "contacto de referencia"
                : "contactos de referencia"}
            </p>
            <div className="team-people">
              {people.map((person) => (
                <div key={person.id}>
                  <span className="mini-avatar">
                    {String(person.name || "?").charAt(0)}
                  </span>
                  <strong>{person.name}</strong>
                </div>
              ))}
            </div>
            <Link
              className="text-link"
              to={`/directorio?q=${encodeURIComponent(department)}`}
            >
              Conectar con el área <ArrowRight size={14} />
            </Link>
          </section>
        ))}
      </div>
      {directory.status === "ready" && groups.length === 0 && (
        <div className="panel empty-state">
          <Users size={32} />
          <h2>Estamos preparando esta vista del equipo</h2>
          <p>
            Las áreas aparecerán cuando se publiquen contactos en el directorio.
          </p>
        </div>
      )}
    </div>
  );
}
