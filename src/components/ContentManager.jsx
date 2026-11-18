import { useCallback, useRef, useState } from "react";
import { addDoc, collection, doc, runTransaction } from "firebase/firestore";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../firebase";
import { normalize } from "../lib/preferences";
import { contentPayload, sameContent } from "../lib/content";
import Modal from "./Modal";

const empty = {
  news: { title: "", desc: "", type: "anuncio" },
  directory: { department: "", name: "", email: "", color: "#135e40" },
};
export default function ContentManager({
  kind,
  items,
  onSavedRecord,
  onDelete,
}) {
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [values, setValues] = useState(empty[kind]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const lock = useRef(false);
  const busyRef = useRef(false);
  const dirty = useRef(false);
  const news = kind === "news";
  const close = useCallback(() => {
    if (busyRef.current) return;
    if (dirty.current) setDiscard(true);
    else setEditor(null);
  }, []);
  const open = (item) => {
    if (busyRef.current) return;
    setValues(item ? { ...item } : { ...empty[kind] });
    setEditor({ original: item ? { ...item } : null });
    dirty.current = false;
    setDiscard(false);
    setError("");
  };
  const change = (event) => {
    dirty.current = true;
    setError("");
    setValues((old) => ({ ...old, [event.target.name]: event.target.value }));
  };
  const save = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    let payload;
    try {
      payload = contentPayload(kind, values);
    } catch (e) {
      setError(e.message);
      return;
    }
    lock.current = true;
    busyRef.current = true;
    setBusy(true);
    try {
      let savedId = editor.original?.id;
      if (editor.original) {
        const ref = doc(db, kind, editor.original.id);
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(ref);
          if (!snapshot.exists())
            throw new Error(
              "Este registro fue eliminado. Tus cambios siguen aquí; copia el contenido antes de cerrar.",
            );
          if (!sameContent(kind, editor.original, snapshot.data())) {
            const conflict = new Error(
              "Otro administrador modificó este registro. Tus cambios siguen aquí; cierra y vuelve a abrir su versión actual antes de guardar.",
            );
            conflict.currentRecord = { id: snapshot.id, ...snapshot.data() };
            throw conflict;
          }
          transaction.update(ref, payload);
        });
      } else savedId = (await addDoc(collection(db, kind), payload)).id;
      onSavedRecord({ id: savedId, ...payload });
      dirty.current = false;
      setEditor(null);
      toast.success(
        editor.original
          ? "Cambios guardados."
          : news
            ? "Publicación creada."
            : "Contacto creado.",
      );
    } catch (e) {
      if (e.currentRecord) onSavedRecord(e.currentRecord);
      setError(
        e.code
          ? "No pudimos guardar. Revisa tu conexión y tu acceso; tus cambios siguen aquí."
          : e.message,
      );
    } finally {
      lock.current = false;
      busyRef.current = false;
      setBusy(false);
    }
  };
  const visible = items.filter((item) =>
    normalize(
      news
        ? `${item.title} ${item.desc}`
        : `${item.name} ${item.department} ${item.email}`,
    ).includes(normalize(query)),
  );
  return (
    <section className="content-manager">
      <div className="content-toolbar">
        <div>
          <h2>{news ? "Publicaciones" : "Contactos"}</h2>
          <p>
            {items.length} {news ? "publicaciones" : "contactos"}
          </p>
        </div>
        <button className="btn btn-forest" onClick={() => open(null)}>
          <Plus size={17} />
          {news ? "Nueva publicación" : "Nuevo contacto"}
        </button>
      </div>
      <div className="search-field panel content-search">
        <Search size={18} />
        <input
          aria-label={
            news ? "Buscar publicaciones" : "Buscar contactos en administración"
          }
          placeholder={
            news ? "Busca por título o contenido" : "Nombre, área o correo"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="content-list">
        {visible.map((item) => (
          <article className="panel content-record" key={item.id}>
            <div className="content-record-copy">
              <span className="category-label">
                {news ? item.date : item.department}
              </span>
              <h3>{news ? item.title : item.name}</h3>
              <p>{news ? item.desc : item.email}</p>
            </div>
            <div className="content-record-actions">
              <button
                className="btn btn-secondary"
                onClick={() => open(item)}
                aria-label={`Editar ${news ? item.title : item.name}`}
              >
                <Pencil size={16} />
                Editar
              </button>
              <button
                className="icon-button danger-action"
                aria-label={`Eliminar ${news ? item.title : item.name}`}
                onClick={() => onDelete(item.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
        {!visible.length && (
          <div className="panel empty-state">
            <Search size={27} />
            <h3>
              {query
                ? "Sin coincidencias"
                : news
                  ? "Aún no hay publicaciones"
                  : "Aún no hay contactos"}
            </h3>
            <p>
              {query
                ? "Prueba otra palabra."
                : "Usa el botón de arriba para añadir el primero."}
            </p>
          </div>
        )}
      </div>
      {editor && (
        <Modal
          title={
            editor.original
              ? news
                ? "Editar publicación"
                : "Editar contacto"
              : news
                ? "Nueva publicación"
                : "Nuevo contacto"
          }
          onClose={close}
          className="content-editor-modal"
        >
          <form onSubmit={save}>
            <fieldset disabled={busy}>
              {news ? (
                <>
                  <div className="input-group">
                    <label htmlFor="content-title">Título</label>
                    <input
                      data-autofocus
                      id="content-title"
                      name="title"
                      className="input-field"
                      maxLength={100}
                      value={values.title}
                      onChange={change}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="content-type">Tipo</label>
                    <select
                      id="content-type"
                      name="type"
                      className="input-field"
                      value={values.type}
                      onChange={change}
                    >
                      <option value="anuncio">Comunicado</option>
                      <option value="logro">Logro</option>
                      <option value="cumpleaños">Celebración</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="content-desc">Contenido</label>
                    <textarea
                      id="content-desc"
                      name="desc"
                      className="input-field"
                      rows={7}
                      maxLength={10000}
                      value={values.desc}
                      onChange={change}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="content-name">Nombre</label>
                    <input
                      data-autofocus
                      id="content-name"
                      name="name"
                      className="input-field"
                      maxLength={100}
                      value={values.name}
                      onChange={change}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="content-department">Área</label>
                    <input
                      id="content-department"
                      name="department"
                      className="input-field"
                      maxLength={100}
                      value={values.department}
                      onChange={change}
                      required
                      list="content-areas"
                    />
                    <datalist id="content-areas">
                      {[...new Set(items.map((x) => x.department))].map(
                        (area) => (
                          <option key={area} value={area} />
                        ),
                      )}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label htmlFor="content-email">Correo</label>
                    <input
                      id="content-email"
                      name="email"
                      inputMode="email"
                      autoComplete="email"
                      className="input-field"
                      maxLength={254}
                      value={values.email}
                      onChange={change}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="content-color">Color de referencia</label>
                    <input
                      id="content-color"
                      name="color"
                      type="color"
                      className="content-color"
                      value={values.color}
                      onChange={change}
                    />
                  </div>
                </>
              )}
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {discard ? (
              <div className="content-discard" role="alert">
                <p>Hay cambios sin guardar.</p>
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
                    className="btn btn-secondary danger-action"
                    onClick={() => {
                      dirty.current = false;
                      setEditor(null);
                    }}
                  >
                    Descartar cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={close}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button className="btn btn-forest" disabled={busy}>
                  {busy
                    ? "Guardando…"
                    : editor.original
                      ? "Guardar cambios"
                      : news
                        ? "Publicar"
                        : "Guardar contacto"}
                </button>
              </div>
            )}
          </form>
        </Modal>
      )}
    </section>
  );
}
