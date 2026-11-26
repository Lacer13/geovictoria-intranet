import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminDate, useAdminCollection } from "./useAdminCollection";
import CollectionState from "./CollectionState";
import DeleteRecordDialog from "./DeleteRecordDialog";

export default function ScoresSection() {
  const { items, status, retry } = useAdminCollection("leaderboard");
  const [pending, setPending] = useState(null);
  const close = useCallback(() => setPending(null), []);
  if (status !== "ready")
    return <CollectionState status={status} retry={retry} />;
  return (
    <section className="admin-records">
      <h2>Puntajes de pausa activa</h2>
      <p>Retira únicamente registros que deban corregirse o moderarse.</p>
      {[...items]
        .sort((a, b) => b.score - a.score)
        .map((item) => (
          <article className="panel access-member" key={item.id}>
            <div className="access-member-copy">
              <h3>{item.name}</h3>
              <p>
                {item.score} puntos · {adminDate(item.date)}
              </p>
            </div>
            <button
              className="icon-button danger-action"
              aria-label={`Eliminar puntaje de ${item.name}`}
              onClick={() => setPending(item)}
            >
              <Trash2 size={18} />
            </button>
          </article>
        ))}
      {!items.length && (
        <p className="panel empty-state">No hay puntajes registrados.</p>
      )}
      {pending && (
        <DeleteRecordDialog
          path={["leaderboard", pending.id]}
          label={`el puntaje de ${pending.name}`}
          onClose={close}
        />
      )}
    </section>
  );
}
