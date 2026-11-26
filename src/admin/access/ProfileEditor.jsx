import { useCallback, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import Modal from "../../components/Modal";
import {
  PERMISSION_GROUPS,
  PROFILE_TEMPLATES,
  normalizeProfile,
  togglePermission,
} from "../permissions";
import { saveProfile } from "../accessStore";

export default function ProfileEditor({
  profile,
  initial,
  actor,
  affected,
  onClose,
}) {
  const [values, setValues] = useState(() =>
    profile || initial
      ? {
          ...(profile || initial),
          permissions: [...(profile || initial).permissions],
        }
      : { name: "", description: "", permissions: [], active: true },
  );
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const dirty = useRef(false);
  const close = useCallback(() => {
    if (lock.current) return;
    if (dirty.current) setDiscard(true);
    else onClose();
  }, [onClose]);
  const change = (update) => {
    dirty.current = true;
    setDiscard(false);
    setValues((old) => ({ ...old, ...update }));
    setReview(false);
    setError("");
  };
  const save = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    try {
      normalizeProfile(values);
      if (profile && !review) {
        setReview(true);
        return;
      }
      lock.current = true;
      setBusy(true);
      setError("");
      await saveProfile(values, profile);
      onClose();
    } catch (err) {
      setError(
        err.code
          ? "No pudimos guardar. Revisa tus permisos y la versión actual del perfil; tus cambios siguen aquí."
          : err.message,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal
      title={profile ? "Editar perfil" : "Crear perfil personalizado"}
      className="access-profile-modal"
      onClose={close}
    >
      <p className="access-intro">
        Define qué puede hacer este perfil. Después podrás asignarlo a una o
        varias personas.
      </p>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          {!profile && (
            <label className="input-group">
              <span>Empezar con una plantilla (opcional)</span>
              <select
                className="input-field"
                defaultValue=""
                onChange={(event) => {
                  const template =
                    PROFILE_TEMPLATES[Number(event.target.value)];
                  if (template)
                    change({
                      ...template,
                      permissions: [...template.permissions],
                    });
                }}
              >
                <option value="" disabled>
                  Selecciona una plantilla o configura desde cero
                </option>
                {PROFILE_TEMPLATES.map((template, index) => (
                  <option
                    key={template.name}
                    value={index}
                    disabled={
                      !actor.owner &&
                      template.permissions.some(
                        (permission) => !actor.permissions.includes(permission),
                      )
                    }
                  >
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="input-group">
            <span>Nombre del perfil *</span>
            <input
              data-autofocus
              className="input-field"
              maxLength={60}
              required
              value={values.name}
              onChange={(event) => change({ name: event.target.value })}
              placeholder="Ej. Coordinador de contenidos"
            />
          </label>
          <label className="input-group">
            <span>Descripción</span>
            <textarea
              className="input-field"
              maxLength={200}
              rows={2}
              value={values.description}
              onChange={(event) => change({ description: event.target.value })}
              placeholder="Describe para quién es este perfil"
            />
          </label>
          <div className="access-permission-heading">
            <h3>
              <ShieldCheck size={18} /> Permisos del perfil
            </h3>
            <span>{values.permissions.length} seleccionados</span>
          </div>
          <div className="access-permission-grid">
            {PERMISSION_GROUPS.map((group) => (
              <fieldset className="access-permission-group" key={group.id}>
                <legend>{group.label}</legend>
                {group.permissions.map((permission) => (
                  <label key={permission.id}>
                    <input
                      type="checkbox"
                      checked={values.permissions.includes(permission.id)}
                      disabled={
                        !actor.owner &&
                        !actor.permissions.includes(permission.id)
                      }
                      onChange={(event) =>
                        change({
                          permissions: togglePermission(
                            values.permissions,
                            permission.id,
                            event.target.checked,
                          ),
                        })
                      }
                    />
                    <span>{permission.label}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          {values.permissions.includes("access.manage") && (
            <p className="inline-notice">
              Este perfil podrá administrar personas y perfiles, pero solo podrá
              otorgar permisos que ya tenga. No podrá ampliar su propio perfil.
            </p>
          )}
          {profile && (
            <label className="access-switch">
              <input
                type="checkbox"
                checked={values.active}
                onChange={(event) => change({ active: event.target.checked })}
              />{" "}
              Perfil habilitado
            </label>
          )}
        </fieldset>
        {review && (
          <div className="access-review" role="status">
            <strong>Revisa el alcance del cambio</strong>
            <p>
              Se actualizarán los permisos de {affected}{" "}
              {affected === 1 ? "persona asignada" : "personas asignadas"},
              incluidas las que tengan una sesión abierta.{" "}
              {!values.active &&
                "Al deshabilitar el perfil perderán el acceso administrativo hasta que se reactive o se les asigne otro perfil."}
            </p>
          </div>
        )}
        {discard && (
          <div className="access-review" role="alert">
            <strong>Tienes cambios sin guardar</strong>
            <p>Puedes seguir editando el perfil o descartar estos cambios.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDiscard(false)}
              >
                Seguir editando
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Descartar cambios
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={close}
          >
            Cancelar
          </button>
          <button className="btn btn-forest" disabled={busy}>
            {busy
              ? "Guardando…"
              : review
                ? "Confirmar cambios del perfil"
                : profile
                  ? "Revisar cambios"
                  : "Crear perfil"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
