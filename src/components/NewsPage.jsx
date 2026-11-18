import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCheck, Megaphone } from "lucide-react";
import { usePortal } from "../context/portal";
import { isPublicationRead } from "../lib/news";
import { DataState } from "./Dashboard";
const typeNames = {
  anuncio: "Comunicado",
  logro: "Logro",
  cumpleaños: "Celebración",
};
export default function NewsPage() {
  const [params] = useSearchParams();
  const id = params.get("publicacion");
  const { news, readNews, markNewsRead, unreadNews } = usePortal();
  const [filter, setFilter] = useState("Todas");
  const [shown, setShown] = useState(12);
  const article = news.data.find((n) => n.id === id);
  useEffect(() => {
    if (article) markNewsRead([article]);
  }, [article, markNewsRead]);
  if (id && article)
    return (
      <article className="article-page page-enter">
        <Link to="/novedades" className="text-link back-link">
          <ArrowLeft size={16} />
          Todas las novedades
        </Link>
        <div className="page-heading">
          <span className="eyebrow">
            {typeNames[article.type] || "Publicación"} · {article.date}
          </span>
          <h1>{article.title}</h1>
        </div>
        <div className="panel publication-body">{article.desc}</div>
      </article>
    );
  if (id && news.status === "loading")
    return (
      <div className="panel">
        <DataState resource={news} />
      </div>
    );
  if (id && news.status === "error")
    return (
      <div className="panel">
        <DataState resource={news} />
      </div>
    );
  const visible = news.data.filter(
    (n) =>
      filter === "Todas" ||
      (filter === "Sin leer"
        ? !isPublicationRead(n, readNews)
        : typeNames[n.type] === filter),
  );
  return (
    <div className="page-enter">
      <div className="page-heading">
        <h1>Novedades</h1>
        <p>
          {unreadNews.length
            ? `${unreadNews.length} publicaciones sin leer`
            : "Comunicados y celebraciones del equipo."}
        </p>
      </div>
      {id && !article && (
        <p className="inline-notice" role="status">
          Esta publicación ya no está disponible. Puedes explorar las demás.
        </p>
      )}
      <div className="publication-toolbar">
        <div className="filter-pills" aria-label="Filtrar publicaciones">
          {["Todas", "Sin leer", "Comunicado", "Logro", "Celebración"].map(
            (f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                className={filter === f ? "active" : ""}
                onClick={() => {
                  setFilter(f);
                  setShown(12);
                }}
              >
                {f}
              </button>
            ),
          )}
        </div>
        {unreadNews.length > 0 && (
          <button className="text-link" onClick={() => markNewsRead(news.data)}>
            <CheckCheck size={16} />
            Marcar todas como leídas
          </button>
        )}
      </div>
      <div className="publication-grid">
        {visible.slice(0, shown).map((n) => (
          <Link
            to={`?publicacion=${encodeURIComponent(n.id)}`}
            key={n.id}
            className="panel publication-card"
          >
            <div>
              <span className="quick-icon coral">
                <Megaphone size={21} />
              </span>
              {!isPublicationRead(n, readNews) && (
                <span className="department-pill">Sin leer</span>
              )}
            </div>
            <span className="category-label">
              {typeNames[n.type] || "Publicación"} · {n.date}
            </span>
            <h2>{n.title}</h2>
            <p>{n.desc}</p>
            <span className="text-link">
              Leer publicación <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </div>
      {(news.status !== "ready" || !visible.length) && (
        <div className="panel">
          <DataState
            resource={news}
            empty={
              filter === "Sin leer"
                ? "Estás al día"
                : "No hay publicaciones en esta vista"
            }
          />
        </div>
      )}
      {shown < visible.length && (
        <button
          className="btn btn-secondary load-more"
          onClick={() => setShown((n) => n + 12)}
        >
          Mostrar más publicaciones
        </button>
      )}
      <p className="local-save-caption">
        Las lecturas se recuerdan en este navegador.
      </p>
    </div>
  );
}
