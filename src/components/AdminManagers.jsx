import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Copy,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
  UserRoundMinus,
} from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../firebase";
import { auth } from "../auth";
import Modal from "./Modal";

export default function AdminManagers() {
  const [admins, setAdmins] = useState([]);
  const [status, setStatus] = useState("loading");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const close = useCallback(() => setPending(null), []);
  useEffect(
    () =>
      onSnapshot(
        collection(db, "administrators"),
        (snapshot) => {
          setAdmins(
            snapshot.docs
              .map((d) => ({ ...d.data(), id: d.id }))
              .sort((a, b) =>
                a.role === "owner"
                  ? -1
                  : b.role === "owner"
                    ? 1
                    : a.email.localeCompare(b.email),
              ),
          );
          setStatus("ready");
        },
        () => setStatus("error"),
      ),
    [],
  );
  const add = async (event) => {
    event.preventDefault();
    if (busy) return;
    const address = email.trim().toLowerCase();
    if (address.includes("/") || address.length > 254) {
      toast.error("Revisa el correo ingresado.");
      return;
    }
    setBusy(true);
    try {
      const ref = doc(db, "administrators", address);
      if ((await getDoc(ref)).exists()) {
        toast.error(
          "Este correo ya figura en la lista. Puedes reactivar su acceso si está desactivado.",
        );
        return;
      }
      await setDoc(ref, {
        email: address,
        role: "admin",
        active: true,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setEmail("");
      toast.success(
        "Correo autorizado. Comparte el enlace de activación con esa persona.",
      );
    } catch {
      toast.error(
        "No pudimos autorizar el correo. Revisa tu conexión y vuelve a intentarlo.",
      );
    } finally {
      setBusy(false);
    }
  };
  const changeAccess = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, "administrators", pending.id), {
        active: !pending.active,
        updatedAt: serverTimestamp(),
      });
      toast.success(pending.active ? "Acceso retirado." : "Acceso reactivado.");
      setPending(null);
    } catch {
      toast.error("No pudimos actualizar el acceso.");
    } finally {
      setBusy(false);
    }
  };
  const copy = async (address) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/admin?correo=${encodeURIComponent(address)}&crear=1`,
      );
      toast.success("Enlace copiado. Compártelo con la persona autorizada.");
    } catch {
      toast.error(
        "No pudimos copiarlo. Comparte la dirección de Administración.",
      );
    }
  };
  return (
    <section className="admin-managers">
      <div className="admin-management-heading">
        <span className="quick-icon green">
          <ShieldCheck size={23} />
        </span>
        <div>
          <h2>Personas que cuidan este espacio.</h2>
          <p>Autoriza nuevos administradores y gestiona su acceso.</p>
        </div>
      </div>
      <div className="panel admin-invite">
        <h3>
          <UserPlus size={19} /> Autorizar otro administrador
        </h3>
        <p>
          La persona deberá crear o activar su cuenta y verificar su correo.
          Autorizar un correo no envía mensajes automáticamente.
        </p>
        <form onSubmit={add}>
          <label className="input-group">
            <span>Correo del nuevo administrador</span>
            <input
              className="input-field"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@geovictoria.com"
              disabled={busy}
            />
          </label>
          <button className="btn btn-forest" disabled={busy}>
            {busy ? "Guardando…" : "Autorizar administrador"}
          </button>
        </form>
      </div>
      <div className="panel admin-members">
        {status === "loading" ? (
          <p role="status">Cargando administradores…</p>
        ) : status === "error" ? (
          <p role="alert">
            No pudimos consultar los administradores. Recarga esta página para
            reintentar.
          </p>
        ) : admins.length === 0 ? (
          <p>No hay correos publicados en la lista de administradores.</p>
        ) : (
          admins.map((person) => {
            const own = person.email === auth.currentUser?.email?.toLowerCase();
            const protectedAccount = person.role === "owner" || own;
            return (
              <article key={person.id} className="admin-member">
                <span
                  className={`quick-icon ${person.active ? "green" : "coral"}`}
                >
                  {person.role === "owner" ? (
                    <LockKeyhole size={20} />
                  ) : (
                    <ShieldCheck size={20} />
                  )}
                </span>
                <div>
                  <strong>
                    {person.email}
                    {own ? " · Tú" : ""}
                  </strong>
                  <p>
                    {person.role === "owner"
                      ? "Administrador principal · Cuenta protegida"
                      : person.active
                        ? "Administrador autorizado · Requiere correo verificado"
                        : "Acceso desactivado"}
                  </p>
                </div>
                <div className="admin-member-actions">
                  {person.active && (
                    <button
                      className="icon-button"
                      aria-label={`Copiar enlace para ${person.email}`}
                      onClick={() => copy(person.email)}
                    >
                      <Copy size={17} />
                    </button>
                  )}
                  {protectedAccount ? (
                    <span className="department-pill">Protegido</span>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      disabled={busy}
                      onClick={() => setPending(person)}
                    >
                      {person.active ? (
                        <UserRoundMinus size={15} />
                      ) : (
                        <UserPlus size={15} />
                      )}
                      {person.active ? "Retirar acceso" : "Reactivar"}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
      <p className="local-save-caption">
        La cuenta principal y tu propio acceso no pueden desactivarse desde este
        panel. Los cambios de permisos se aplican en la base de datos y se
        comprueban en cada solicitud.
      </p>
      {pending && (
        <Modal
          title={
            pending.active
              ? "Retirar acceso de administrador"
              : "Reactivar acceso"
          }
          onClose={close}
        >
          <p>
            ¿Confirmas {pending.active ? "retirar" : "reactivar"} el acceso de{" "}
            <strong>{pending.email}</strong>?
          </p>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Podrás volver a cambiar su estado desde esta lista.
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={close}
            >
              Cancelar
            </button>
            <button
              className="btn btn-forest"
              disabled={busy}
              onClick={changeAccess}
            >
              {busy ? "Actualizando…" : "Confirmar"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
