export default function CollectionState({ status, retry }) {
  if (status === "loading")
    return (
      <p className="admin-status" role="status">
        Cargando información…
      </p>
    );
  return (
    <div className="panel access-state" role="alert">
      <p>
        No pudimos consultar esta sección. Revisa la conexión y tus permisos.
      </p>
      <button className="btn btn-secondary" onClick={retry}>
        Reintentar
      </button>
    </div>
  );
}
