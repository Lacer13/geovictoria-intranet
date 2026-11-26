import { useCallback, useState } from "react";
import { Copy, Pencil, Plus, Search, ShieldCheck } from "lucide-react";
import { normalize } from "../../lib/preferences";
import { canGrant, PERMISSION_GROUPS } from "../permissions";
import ProfileEditor from "./ProfileEditor";

export default function ProfilesPanel({ profiles, members, actor }) {
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(null);
  const close = useCallback(() => setEditor(null), []);
  const visible = profiles.filter((profile) =>
    normalize(`${profile.name} ${profile.description}`).includes(
      normalize(search),
    ),
  );
  return (
    <section>
      <div className="access-toolbar">
        <div>
          <h3>Perfiles personalizados</h3>
          <p>
            Un perfil reúne los permisos de un equipo o una responsabilidad.
          </p>
        </div>
        <button
          className="btn btn-forest"
          onClick={() => setEditor({ profile: null })}
        >
          <Plus size={16} /> Crear perfil
        </button>
      </div>
      {profiles.length > 0 && (
        <label className="search-field access-search">
          <Search size={17} />
          <input
            aria-label="Buscar perfiles"
            placeholder="Nombre o descripción del perfil…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      )}
      {!profiles.length && (
        <div className="panel empty-state access-empty">
          <ShieldCheck size={36} />
          <h3>Distintas responsabilidades, distintos permisos</h3>
          <p>
            Crea tu primer perfil desde cero o usa una plantilla. Podrás cambiar
            sus permisos después, sin tocar el código.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => setEditor({ profile: null })}
          >
            Crear mi primer perfil
          </button>
        </div>
      )}
      <div className="access-profile-list">
        {visible.map((profile) => {
          const assigned = members.filter(
            (member) => member.profileId === profile.id,
          ).length;
          const ownProfile = !actor.owner && actor.profileId === profile.id;
          const editable = !ownProfile && canGrant(actor, profile.permissions);
          return (
            <article className="panel access-profile-card" key={profile.id}>
              <div className="access-card-heading">
                <span className="quick-icon green">
                  <ShieldCheck size={21} />
                </span>
                <div>
                  <h3>{profile.name}</h3>
                  <span
                    className={`access-badge ${profile.active ? "active" : ""}`}
                  >
                    {profile.active ? "Habilitado" : "Deshabilitado"}
                  </span>
                </div>
              </div>
              <p>{profile.description || "Sin descripción"}</p>
              <div className="access-module-tags">
                {PERMISSION_GROUPS.filter((group) =>
                  group.permissions.some((permission) =>
                    profile.permissions.includes(permission.id),
                  ),
                ).map((group) => (
                  <span key={group.id}>{group.label}</span>
                ))}
              </div>
              <small>
                {profile.permissions.length} permisos · {assigned}{" "}
                {assigned === 1 ? "persona asignada" : "personas asignadas"}
              </small>
              <div className="access-card-actions">
                {editable && (
                  <button
                    className="btn btn-secondary"
                    aria-label={`Editar perfil ${profile.name}`}
                    onClick={() => setEditor({ profile })}
                  >
                    <Pencil size={15} /> Editar
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  disabled={!canGrant(actor, profile.permissions)}
                  aria-label={`Duplicar perfil ${profile.name}`}
                  onClick={() =>
                    setEditor({
                      profile: null,
                      initial: {
                        ...profile,
                        name: `Copia de ${profile.name}`.slice(0, 60),
                        active: true,
                      },
                    })
                  }
                >
                  <Copy size={15} /> Duplicar
                </button>
              </div>
              {ownProfile && (
                <p className="field-caption">
                  Tu propio perfil está protegido. Otro administrador con
                  permisos suficientes puede modificarlo.
                </p>
              )}
              {!ownProfile && !editable && (
                <p className="field-caption">
                  Este perfil contiene permisos que no puedes otorgar.
                </p>
              )}
            </article>
          );
        })}
      </div>
      {profiles.length > 0 && !visible.length && (
        <p className="panel empty-state">
          No encontramos perfiles con esa búsqueda.
        </p>
      )}
      {editor && (
        <ProfileEditor
          key={editor.profile?.id || "new"}
          profile={editor.profile}
          initial={editor.initial}
          actor={actor}
          affected={
            members.filter((member) => member.profileId === editor.profile?.id)
              .length
          }
          onClose={close}
        />
      )}
    </section>
  );
}
