import { useCallback, useRef, useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import Modal from "../components/Modal";

export default function DeleteRecordDialog({ path, label, onClose }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const close = useCallback(() => {
    if (!lock.current) onClose();
  }, [onClose]);
  const remove = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await deleteDoc(doc(db, ...path));
      onClose();
    } catch {
      setError(
        "No pudimos eliminar el registro. Comprueba la conexión y tus permisos.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal title="Confirmar eliminación" onClose={close}>
      <p>
        Se eliminará <strong>{label}</strong>. Esta acción no se puede deshacer.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button className="btn btn-secondary" disabled={busy} onClick={close}>
          Cancelar
        </button>
        <button className="btn btn-forest" disabled={busy} onClick={remove}>
          {busy ? "Eliminando…" : "Eliminar registro"}
        </button>
      </div>
    </Modal>
  );
}
