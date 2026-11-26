import { useCallback, useRef, useState } from "react";
import Modal from "../../components/Modal";
import { updateAdministrator } from "../accessStore";
import { canGrant } from "../permissions";

export default function MemberEditor({ member, profiles, actor, onClose }) {
  const [profileId, setProfileId] = useState(member.profileId || "");
  const [active, setActive] = useState(member.active);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const close = useCallback(() => {
    if (!lock.current) onClose();
  }, [onClose]);
  const save = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await updateAdministrator(member, { active, profileId });
      onClose();
    } catch (err) {
      setError(
        err.code
          ? "No pudimos cambiar el acceso. Revisa tus permisos y la versión actual de la persona."
          : err.message,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal title="Editar acceso de administrador" onClose={close}>
      <p>
        Revisa el acceso de <strong>{member.email}</strong>.
      </p>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <label className="input-group">
            <span>Perfil asignado *</span>
            <select
              className="input-field"
              required
              value={profileId}
              onChange={(event) => setProfileId(event.target.value)}
            >
              <option value="" disabled>
                Elige un perfil
              </option>
              {profiles
                .filter(
                  (profile) =>
                    canGrant(actor, profile.permissions) &&
                    (profile.active || profile.id === member.profileId),
                )
                .map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                    {!profile.active ? " · Deshabilitado" : ""}
                  </option>
                ))}
            </select>
          </label>
          <label className="access-switch">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />{" "}
            Acceso habilitado
          </label>
        </fieldset>
        <div className="access-review">
          <p>
            {active
              ? "La persona podrá utilizar únicamente los módulos y acciones del perfil seleccionado."
              : "La persona perderá su acceso administrativo. Su cuenta y los datos que creó se conservarán."}
          </p>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={busy}
            onClick={close}
          >
            Cancelar
          </button>
          <button className="btn btn-forest" disabled={busy || !profileId}>
            {busy ? "Guardando…" : "Guardar acceso"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
