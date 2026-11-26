import { useCallback, useState } from "react";
import { Inbox, Trash2 } from "lucide-react";
import { adminDate, useAdminCollection } from "./useAdminCollection";
import CollectionState from "./CollectionState";
import DeleteRecordDialog from "./DeleteRecordDialog";

export default function ReportsSection({ access }) {
  const { items, status, retry } = useAdminCollection("feedbacks");
  const [pending, setPending] = useState(null);
  const close = useCallback(() => setPending(null), []);
  if (status !== "ready")
    return <CollectionState status={status} retry={retry} />;
  return (
    <section className="admin-records">
      <header className="access-toolbar">
        <div>
          <h2>Buzón de reportes</h2>
          <p>{items.length} reportes · Información privada</p>
        </div>
        {!access.permissions.includes("reports.delete") && (
          <span className="access-badge">Solo consulta</span>
        )}
      </header>
      {!items.length ? (
        <div className="panel empty-state">
          <Inbox size={36} />
          <h3>El buzón está vacío</h3>
          <p>Aquí aparecerán las solicitudes y los reportes del equipo.</p>
        </div>
      ) : (
        [...items]
          .sort((a, b) => String(b.date).localeCompare(String(a.date)))
          .map((item) => (
            <article className="panel admin-report" key={item.id}>
              <header>
                <div>
                  <h3>{item.isAnonymous ? "Reporte anónimo" : item.name}</h3>
                  <p>
                    {!item.isAnonymous && item.department
                      ? `${item.department} · `
                      : ""}
                    {adminDate(item.createdAt || item.date)}
                  </p>
                </div>
                {access.permissions.includes("reports.delete") && (
                  <button
                    className="icon-button danger-action"
                    aria-label={`Eliminar reporte de ${item.isAnonymous ? "Anónimo" : item.name}`}
                    onClick={() => setPending(item)}
                  >
                    <Trash2 size={19} />
                  </button>
                )}
              </header>
              <p className="admin-report-message">{item.message}</p>
            </article>
          ))
      )}
      {pending && (
        <DeleteRecordDialog
          path={["feedbacks", pending.id]}
          label="este reporte"
          onClose={close}
        />
      )}
    </section>
  );
}
