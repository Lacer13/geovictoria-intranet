import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminDate, useAdminCollection } from "./useAdminCollection";
import CollectionState from "./CollectionState";
import DeleteRecordDialog from "./DeleteRecordDialog";
import { SCORE_BOARDS, scoreBoardPath } from "../game/scoreboard.js";

function ScoreRecords({ boardId }) {
  const { items, status, retry } = useAdminCollection(scoreBoardPath(boardId));
  const [pending, setPending] = useState(null);
  const close = useCallback(() => setPending(null), []);
  if (status !== "ready") return <CollectionState status={status} retry={retry} />;
  return <>
    {[...items].sort((a,b) => b.score-a.score).map(item => <article className="panel access-member" key={item.id}>
      <div className="access-member-copy"><h3>{item.name}</h3><p>{item.score} puntos · {adminDate(item.date)}</p></div>
      <button className="icon-button danger-action" aria-label={`Eliminar puntaje de ${item.name}`} onClick={() => setPending(item)}><Trash2 size={18} /></button>
    </article>)}
    {!items.length && <p className="panel empty-state">No hay puntajes registrados.</p>}
    {pending && <DeleteRecordDialog path={[...scoreBoardPath(boardId).split("/"),pending.id]} label={`el puntaje de ${pending.name}`} onClose={close} />}
  </>;
}
export default function ScoresSection() {
  const [boardId,setBoardId]=useState("arcade");
  return <section className="admin-records">
    <h2>Puntajes de juegos y minijuegos</h2><p>Elige la tabla que deseas moderar. Retira únicamente registros que deban corregirse o moderarse.</p>
    <label>Tabla de puntajes <select value={boardId} onChange={e=>setBoardId(e.target.value)}>{SCORE_BOARDS.map(board=><option key={board.id} value={board.id}>{board.label}</option>)}</select></label>
    <ScoreRecords key={boardId} boardId={boardId} />
  </section>;
}
