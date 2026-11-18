import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  LayoutGrid,
  Megaphone,
  Search,
  Users,
} from "lucide-react";
import { usePortal } from "../context/portal";
import { articles } from "../data/knowledge";
import { buildSearchIndex, searchIndex, searchTypes } from "../lib/search";
const icons = {
  Secciones: LayoutGrid,
  Guías: BookOpen,
  Personas: Users,
  Publicaciones: Megaphone,
};
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const term = params.get("q") || "";
  const [type, setType] = useState("Todo");
  const [shown, setShown] = useState(20);
  const { directory, news } = usePortal();
  const index = buildSearchIndex({
    articles,
    directory: directory.data,
    news: news.data,
  });
  const matches = searchIndex(index, term, type);
  return (
    <div className="page-enter">
      <div className="page-heading">
        <h1>Buscar en la intranet</h1>
        <p>Guías, personas y publicaciones en un solo lugar.</p>
      </div>
      <div className="search-field panel content-search">
        <Search size={19} />
        <input
          aria-label="Buscar contenido"
          value={term}
          placeholder="¿Qué necesitas encontrar?"
          onChange={(e) => {
            setParams(e.target.value ? { q: e.target.value } : {}, {
              replace: true,
            });
            setShown(20);
          }}
        />
      </div>
      <div className="filter-pills" aria-label="Tipo de resultado">
        {searchTypes.map((t) => (
          <button
            key={t}
            aria-pressed={type === t}
            className={type === t ? "active" : ""}
            onClick={() => {
              setType(t);
              setShown(20);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {(directory.status === "error" || news.status === "error") && (
        <div className="inline-notice" role="status">
          Algunos resultados no pudieron cargarse.{" "}
          <button
            className="text-link"
            onClick={() => {
              directory.retry();
              news.retry();
            }}
          >
            Reintentar
          </button>
        </div>
      )}
      {(directory.status === "loading" || news.status === "loading") && (
        <p role="status">Cargando contactos y publicaciones…</p>
      )}
      <p className="results-count" role="status">
        {matches.length} {matches.length === 1 ? "resultado" : "resultados"}
      </p>
      <div className="search-page-results">
        {matches.slice(0, shown).map((result) => {
          const Icon = icons[result.type];
          return (
            <Link
              key={result.id}
              className="panel search-page-result"
              to={result.path}
            >
              <span className="quick-icon green">
                <Icon size={20} />
              </span>
              <div>
                <span className="category-label">{result.type}</span>
                <h2>{result.title}</h2>
                <p>{result.detail}</p>
              </div>
              <ArrowRight size={17} />
            </Link>
          );
        })}
      </div>
      {!matches.length && (
        <div className="panel empty-state">
          <Search size={28} />
          <h2>Sin coincidencias</h2>
          <p>Prueba una palabra más corta o cambia el tipo de resultado.</p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setParams({});
              setType("Todo");
              setShown(20);
            }}
          >
            Limpiar búsqueda
          </button>
        </div>
      )}
      {shown < matches.length && (
        <button
          className="btn btn-secondary load-more"
          onClick={() => setShown((n) => n + 20)}
        >
          Mostrar más resultados
        </button>
      )}
    </div>
  );
}
