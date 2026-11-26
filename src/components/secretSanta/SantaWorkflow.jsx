import { Check, Link2, Shuffle, Users } from "lucide-react";
import "../../secret-santa-links.css";
import "../../secret-santa-experience.css";

export default function SantaWorkflow({ drawn = false, ready = false }) {
  const current = drawn ? 2 : ready ? 1 : 0;
  return (
    <ol className="santa-workflow" aria-label="Pasos del intercambio">
      {[
        [Users, "Grupo", "Detalles y participantes"],
        [Shuffle, "Sorteo", "Una pareja para cada persona"],
        [Link2, "Compartir", "Enlace personal o correo"],
      ].map(([Icon, title, caption], index) => (
        <li
          key={title}
          className={
            index < current ? "complete" : index === current ? "current" : ""
          }
          aria-current={index === current ? "step" : undefined}
        >
          <span>
            {index < current ? <Check size={17} /> : <Icon size={18} />}
          </span>
          <div>
            <strong>{title}</strong>
            <small>{caption}</small>
          </div>
          <b aria-hidden="true">0{index + 1}</b>
        </li>
      ))}
    </ol>
  );
}
