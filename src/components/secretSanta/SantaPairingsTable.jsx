import { useState } from "react";
import {
  ArrowDownToLine,
  Check,
  Copy,
  EyeOff,
  LockKeyhole,
  Search,
  X,
} from "lucide-react";
import {
  pairingsCSV,
  pairingsTSV,
  santaPairings,
} from "../../lib/santaPairings";
import "../../santa-pairings.css";

export default function SantaPairingsTable({ event, onHide }) {
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState("giver");
  const [emails, setEmails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const rows = santaPairings(event, term, sort);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pairingsTSV(rows, emails));
      setCopied(true);
      setError("");
    } catch {
      setError(
        "No pudimos copiar la tabla. Puedes descargar el CSV para abrirlo en una hoja de cálculo.",
      );
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([pairingsCSV(rows, emails)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `amigo-secreto-parejas-${event.id}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const change = (setter) => (value) => {
    setter(value);
    setCopied(false);
    setError("");
  };
  return (
    <section className="santa-pairings" aria-label="Tabla rápida de parejas">
      <div className="santa-pairings-notice">
        <LockKeyhole size={17} />
        <p>
          <strong>Vista privada de las parejas.</strong> La columna «Entrega»
          indica quién regala; «Recibe», a quién le toca. Los enlaces personales
          no se incluyen en esta tabla.
        </p>
        <button className="btn btn-secondary" onClick={onHide}>
          <EyeOff size={15} /> Ocultar parejas
        </button>
      </div>
      <div className="santa-pairings-controls">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Buscar quién entrega o recibe"
            placeholder="Busca a quien entrega o recibe…"
            value={term}
            onChange={(event) => change(setTerm)(event.target.value)}
          />
        </label>
        <label className="santa-pairings-sort">
          Ordenar por
          <select
            className="input-field"
            value={sort}
            onChange={(event) => change(setSort)(event.target.value)}
          >
            <option value="giver">Quien entrega</option>
            <option value="recipient">Quien recibe</option>
          </select>
        </label>
      </div>
      <div className="santa-pairings-toolbar">
        <p role="status">
          {rows.length} de {event.participantIds.length} parejas
          {term && (
            <button className="text-link" onClick={() => change(setTerm)("")}>
              Limpiar búsqueda <X size={13} />
            </button>
          )}
        </p>
        <label>
          <input
            type="checkbox"
            checked={emails}
            onChange={(event) => change(setEmails)(event.target.checked)}
          />{" "}
          Mostrar correos
        </label>
        <div>
          <button
            className="btn btn-secondary"
            disabled={!rows.length}
            onClick={copy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Tabla copiada" : "Copiar tabla"}
          </button>
          <button
            className="btn btn-secondary"
            disabled={!rows.length}
            onClick={download}
          >
            <ArrowDownToLine size={16} /> Descargar CSV
          </button>
        </div>
      </div>
      <div
        className="santa-pairings-scroll"
        role="region"
        aria-label="Parejas del intercambio"
        tabIndex={0}
      >
        <table>
          <caption className="santa-sr-only">
            Quién le regala a quién · {event.title}
          </caption>
          <thead>
            <tr>
              <th scope="col">Entrega</th>
              <th scope="col">Recibe</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <th scope="row">
                  <span className="santa-pairing-position" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>
                    {row.giver?.name || "Participante no disponible"}
                    {emails && <small>{row.giver?.email}</small>}
                  </span>
                </th>
                <td>
                  <span>
                    {row.recipient?.name || "Sin asignación"}
                    {emails && <small>{row.recipient?.email}</small>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty-state">
            <strong>No encontramos parejas con esa búsqueda.</strong>
            <p>Prueba el nombre o correo de cualquiera de las dos personas.</p>
            <button className="text-link" onClick={() => change(setTerm)("")}>
              Ver todas las parejas
            </button>
          </div>
        )}
      </div>
      <p className="field-caption">
        Copiar y descargar incluyen las {rows.length} parejas de esta vista, en
        el orden elegido{emails ? ", con sus correos" : ", sin correos"}.
      </p>
      {copied && (
        <p className="santa-pairings-status" role="status">
          Lista para pegar en Excel o en una hoja de cálculo.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
