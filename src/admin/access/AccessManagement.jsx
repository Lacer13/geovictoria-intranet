import { useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { useAccessDirectory } from "./useAccessDirectory";
import MembersPanel from "./MembersPanel";
import ProfilesPanel from "./ProfilesPanel";
import "../admin-access.css";

export default function AccessManagement({ actor }) {
  const { members, profiles, status, retry } = useAccessDirectory();
  const [tab, setTab] = useState("members");
  return (
    <section className="access-management">
      <header className="admin-management-heading">
        <span className="quick-icon green">
          <ShieldCheck size={24} />
        </span>
        <div>
          <h2>Personas y perfiles</h2>
          <p>
            Da a cada persona el acceso que necesita y cambia sus permisos desde
            aquí.
          </p>
        </div>
      </header>
      <div className="access-tabs" aria-label="Gestionar accesos">
        <button
          className={`btn ${tab === "members" ? "btn-forest" : "btn-secondary"}`}
          aria-pressed={tab === "members"}
          onClick={() => setTab("members")}
        >
          <Users size={17} /> Personas <span>{members.length}</span>
        </button>
        <button
          className={`btn ${tab === "profiles" ? "btn-forest" : "btn-secondary"}`}
          aria-pressed={tab === "profiles"}
          onClick={() => setTab("profiles")}
        >
          <ShieldCheck size={17} /> Perfiles <span>{profiles.length}</span>
        </button>
      </div>
      {status === "loading" ? (
        <p role="status">Cargando personas y perfiles…</p>
      ) : status === "error" ? (
        <div className="panel" role="alert">
          <p>No pudimos consultar los accesos. Comprueba la conexión.</p>
          <button className="btn btn-secondary" onClick={retry}>
            Reintentar
          </button>
        </div>
      ) : tab === "members" ? (
        <MembersPanel
          members={members}
          profiles={profiles}
          actor={actor}
          onCreateProfile={() => setTab("profiles")}
        />
      ) : (
        <ProfilesPanel members={members} profiles={profiles} actor={actor} />
      )}
    </section>
  );
}
