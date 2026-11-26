import { useCallback, useState } from "react";
import { Copy, LockKeyhole, Pencil, Search, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "../../auth";
import { normalize } from "../../lib/preferences";
import { ALL_PERMISSIONS, canGrant } from "../permissions";
import { inviteAdministrator } from "../accessStore";
import MemberEditor from "./MemberEditor";

export default function MembersPanel({
  members,
  profiles,
  actor,
  onCreateProfile,
}) {
  const [email, setEmail] = useState("");
  const [profileId, setProfileId] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const close = useCallback(() => setEditor(null), []);
  const available = profiles.filter(
    (profile) => profile.active && canGrant(actor, profile.permissions),
  );
  const add = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await inviteAdministrator(email, profileId);
      setEmail("");
      toast.success(
        "Persona autorizada. Copia y comparte su enlace de activación.",
      );
    } catch (err) {
      setError(
        err.code
          ? "No pudimos autorizar el correo. Revisa tus permisos o si el perfil cambió."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  };
  const copy = async (address) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/admin?correo=${encodeURIComponent(address)}&crear=1`,
      );
      toast.success(
        "Enlace de activación copiado. Compártelo solo con esa persona.",
      );
    } catch {
      toast.error(
        "No pudimos copiarlo. Comparte la dirección de Administración.",
      );
    }
  };
  return (
    <section>
      <div className="panel access-invite">
        <h3>
          <UserPlus size={19} /> Autorizar una persona
        </h3>
        <p>
          Elige su perfil. Después deberá crear o activar su cuenta y verificar
          su correo. Esta acción no envía un mensaje.
        </p>
        {!available.length ? (
          <div className="inline-notice">
            Primero necesitas un perfil habilitado que puedas asignar.{" "}
            <button className="text-link" onClick={onCreateProfile}>
              Crear o revisar perfiles
            </button>
          </div>
        ) : (
          <form onSubmit={add}>
            <fieldset disabled={busy}>
              <label className="input-group">
                <span>Correo del administrador *</span>
                <input
                  className="input-field"
                  type="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nombre@geovictoria.com"
                />
              </label>
              <label className="input-group">
                <span>Perfil *</span>
                <select
                  className="input-field"
                  required
                  value={profileId}
                  onChange={(event) => setProfileId(event.target.value)}
                >
                  <option value="" disabled>
                    Selecciona un perfil
                  </option>
                  {available.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-forest" disabled={busy}>
                {busy ? "Autorizando…" : "Autorizar persona"}
              </button>
            </fieldset>
          </form>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <label className="search-field access-search">
        <Search size={17} />
        <input
          aria-label="Buscar administradores"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Busca por correo o perfil…"
        />
      </label>
      <div className="access-members">
        {members
          .filter((member) =>
            normalize(
              `${member.email} ${profiles.find((profile) => profile.id === member.profileId)?.name || ""}`,
            ).includes(normalize(search)),
          )
          .map((member) => {
            const profile = profiles.find(
              (item) => item.id === member.profileId,
            );
            const own = member.email === auth.currentUser?.email?.toLowerCase();
            const protectedAccount = member.role === "owner" || own;
            const targetPermissions = member.profileId
              ? profile?.permissions || []
              : ALL_PERMISSIONS;
            const editable =
              !protectedAccount && canGrant(actor, targetPermissions);
            return (
              <article className="panel access-member" key={member.id}>
                <span className="quick-icon green">
                  <LockKeyhole size={21} />
                </span>
                <div className="access-member-copy">
                  <h3>
                    {member.email}
                    {own ? " · Tú" : ""}
                  </h3>
                  <p>
                    {member.role === "owner"
                      ? "Administrador principal · Cuenta protegida"
                      : profile?.name ||
                        (member.profileId
                          ? "Perfil no disponible"
                          : "Acceso completo · Sin perfil asignado")}
                  </p>
                  <span
                    className={`access-badge ${member.active && (member.role === "owner" || !member.profileId || profile?.active) ? "active" : ""}`}
                  >
                    {!member.active
                      ? "Acceso desactivado"
                      : member.profileId && !profile?.active
                        ? "Perfil deshabilitado o no disponible"
                        : "Acceso habilitado"}
                  </span>
                </div>
                <div className="access-member-actions">
                  {member.active && (
                    <button
                      className="icon-button"
                      aria-label={`Copiar activación para ${member.email}`}
                      onClick={() => copy(member.email)}
                    >
                      <Copy size={17} />
                    </button>
                  )}
                  {editable ? (
                    <button
                      className="btn btn-secondary"
                      aria-label={`Editar acceso de ${member.email}`}
                      onClick={() => setEditor(member)}
                    >
                      <Pencil size={15} /> Editar acceso
                    </button>
                  ) : (
                    <span className="department-pill">
                      {protectedAccount ? "Protegido" : "Fuera de tu alcance"}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
      </div>
      <p className="field-caption">
        La cuenta principal y tu propio acceso están protegidos. Los
        administradores existentes conservan su acceso completo hasta que se les
        asigne un perfil.
      </p>
      {editor && (
        <MemberEditor
          member={editor}
          profiles={profiles}
          actor={actor}
          onClose={close}
        />
      )}
    </section>
  );
}
