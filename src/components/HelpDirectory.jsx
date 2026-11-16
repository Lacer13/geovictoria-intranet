import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Copy,
  LifeBuoy,
  Mail,
  Search,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { usePortal } from "../context/portal";
import { normalize } from "../lib/preferences";
import { DataState } from "./Dashboard";

export default function HelpDirectory() {
  const [params, setParams] = useSearchParams();
  const term = params.get("q") || "";
  const [department, setDepartment] = useState("Todas las áreas");
  const { directory } = usePortal();
  const departments = [
    ...new Set(directory.data.map((c) => c.department).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "es"));
  const contacts = directory.data
    .filter(
      (c) =>
        (department === "Todas las áreas" || c.department === department) &&
        normalize(`${c.name} ${c.department} ${c.email}`).includes(
          normalize(term),
        ),
    )
    .sort((a, b) =>
      String(a.department || "").localeCompare(
        String(b.department || ""),
        "es",
      ),
    );
  const copy = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Correo copiado");
    } catch {
      toast.error("No pudimos copiarlo. Selecciona el correo para copiarlo.");
    }
  };
  return (
    <div className="page-enter">
      <div className="page-heading">
        <span className="eyebrow">LAS PERSONAS CORRECTAS, MÁS CERCA</span>
        <h1>Siempre hay alguien para ayudarte.</h1>
        <p>Encuentra a tu equipo por nombre, correo o área.</p>
      </div>
      <section className="panel directory-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar contactos"
            placeholder="Busca una persona o un área…"
            value={term}
            onChange={(e) =>
              setParams(e.target.value ? { q: e.target.value } : {}, {
                replace: true,
              })
            }
          />
          {term && (
            <button
              className="icon-button"
              onClick={() => setParams({})}
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <select
          className="input-field area-select"
          aria-label="Filtrar por área"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option>Todas las áreas</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </section>
      <div className="results-count" role="status">
        <Users size={15} /> {contacts.length}{" "}
        {contacts.length === 1
          ? "contacto disponible"
          : "contactos disponibles"}
      </div>
      {directory.status !== "ready" && (
        <section className="panel">
          <DataState resource={directory} />
        </section>
      )}
      {directory.status === "ready" && contacts.length === 0 && (
        <section className="panel empty-state">
          <Search size={30} />
          <h2>
            {directory.data.length
              ? "No encontramos coincidencias"
              : "El directorio está por completarse"}
          </h2>
          <p>
            {directory.data.length
              ? "Prueba con otro nombre o selecciona todas las áreas."
              : "Los contactos publicados por Administración aparecerán aquí."}
          </p>
          {directory.data.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setParams({});
                setDepartment("Todas las áreas");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </section>
      )}
      <div className="contact-grid">
        {contacts.map((c) => (
          <article key={c.id} className="panel contact-card">
            <div className="contact-top">
              <span className="contact-avatar">
                {String(c.name || "?")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </span>
              <span className="department-pill">
                {c.department || "Equipo"}
              </span>
            </div>
            <h2>{c.name || "Contacto de equipo"}</h2>
            <p>{c.department}</p>
            <span className="contact-email">
              {c.email || "Correo pendiente de publicación"}
            </span>
            {c.email && (
              <div className="contact-actions">
                <a
                  className="btn btn-secondary"
                  href={`mailto:${encodeURIComponent(c.email)}`}
                >
                  <Mail size={15} /> Escribir un correo <ArrowUpRightIcon />
                </a>
                <button
                  className="icon-button"
                  onClick={() => copy(c.email)}
                  aria-label={`Copiar correo de ${c.name}`}
                >
                  <Copy size={16} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="help-banner">
        <LifeBuoy size={22} />
        <div>
          <strong>¿Tu consulta necesita otro espacio?</strong>
          <p>
            Comparte una solicitud o reporte a través de nuestro canal de
            escucha.
          </p>
        </div>
        <Link to="/solicitudes" className="text-link">
          Te escuchamos <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <span aria-hidden="true">↗</span>;
}
