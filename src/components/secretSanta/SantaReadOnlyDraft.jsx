import { Gift, LockKeyhole } from "lucide-react";
import { readableExchangeDate } from "../../lib/secretSanta";
export default function SantaReadOnlyDraft({ event }) {
  return (
    <section className="panel santa-draft">
      <div className="santa-section-heading">
        <span className="quick-icon green">
          <Gift size={21} />
        </span>
        <div>
          <h3>{event.title}</h3>
          <p>
            {readableExchangeDate(event.exchangeDate)} ·{" "}
            {event.budget || "Presupuesto por coordinar"}
          </p>
        </div>
        <span className="access-badge">Solo consulta</span>
      </div>
      <p className="inline-notice">
        <LockKeyhole size={15} /> Este intercambio está en preparación. Puedes
        consultar el grupo; otro perfil autorizado debe realizar el sorteo.
      </p>
      {event.notes && <p className="santa-card-notes">{event.notes}</p>}
      <h4>{event.participantIds.length} participantes</h4>
      <ul className="santa-readonly-roster">
        {event.participantIds.map((id) => (
          <li key={id}>
            <strong>{event.people[id].name}</strong>
            <span>{event.people[id].email}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
