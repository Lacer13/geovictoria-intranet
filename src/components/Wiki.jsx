import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Clock3,
  Search,
} from "lucide-react";
import { articles, categories } from "../data/knowledge";
import { normalize, readPreference, savePreference } from "../lib/preferences";

function loadBookmarks() {
  try {
    const value = JSON.parse(readPreference("geoBookmarks", "[]"));
    return Array.isArray(value)
      ? value.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}
export default function Wiki() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("Todos");
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved, setSaved] = useState(loadBookmarks);
  const articleId = params.get("articulo");
  const article = articles.find((a) => a.id === articleId);
  const toggleSave = (id) => {
    const value = saved.includes(id)
      ? saved.filter((v) => v !== id)
      : [...saved, id];
    setSaved(value);
    savePreference("geoBookmarks", JSON.stringify(value));
  };
  const filtered = articles.filter(
    (a) =>
      (category === "Todos" || a.category === category) &&
      (!onlySaved || saved.includes(a.id)) &&
      normalize(`${a.title} ${a.intro} ${a.category}`).includes(
        normalize(term),
      ),
  );
  if (article)
    return (
      <article className="article-page page-enter">
        <button className="text-link back-link" onClick={() => setParams({})}>
          <ArrowLeft size={16} /> Volver al centro de conocimiento
        </button>
        <div className="page-heading">
          <span className="eyebrow">{article.category}</span>
          <h1>{article.title}</h1>
          <p>{article.intro}</p>
          <div className="article-meta">
            <span>
              <Clock3 size={15} /> {article.time} min de lectura
            </span>
            <button
              className={`bookmark-button ${saved.includes(article.id) ? "saved" : ""}`}
              onClick={() => toggleSave(article.id)}
              aria-pressed={saved.includes(article.id)}
            >
              <Bookmark
                size={15}
                fill={saved.includes(article.id) ? "currentColor" : "none"}
              />
              {saved.includes(article.id) ? "Guardado" : "Guardar guía"}
            </button>
          </div>
        </div>
        <div className="panel article-content">
          {article.sections.map(([heading, content], i) => (
            <section key={heading}>
              <span className="article-step">0{i + 1}</span>
              <div>
                <h2>{heading}</h2>
                <p>{content}</p>
              </div>
            </section>
          ))}
          <div className="article-note">
            <BookOpen size={18} />
            <p>
              Guía de orientación. Para procedimientos, condiciones o políticas
              oficiales, consulta con el área responsable.
            </p>
          </div>
        </div>
        <div className="help-banner">
          <div>
            <strong>¿Necesitas una respuesta más específica?</strong>
            <p>Encuentra al área responsable en nuestro directorio.</p>
          </div>
          <Link to="/directorio" className="text-link">
            Buscar a mi equipo <ArrowRight size={15} />
          </Link>
        </div>
      </article>
    );
  return (
    <div className="page-enter">
      <div className="page-heading">
        <span className="eyebrow">EL CONOCIMIENTO SE COMPARTE</span>
        <h1>Respuestas para avanzar juntos.</h1>
        <p>Guías prácticas para tu día a día, sin dar tantas vueltas.</p>
      </div>
      {articleId && (
        <div className="inline-notice">
          La guía que buscabas no está disponible. Explora los recursos
          publicados.
        </div>
      )}
      <section className="knowledge-toolbar">
        <div className="search-field panel">
          <Search size={18} />
          <input
            aria-label="Buscar guías"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="¿Qué quieres aprender o resolver?"
          />
        </div>
        <button
          className={`btn btn-secondary ${onlySaved ? "selected-filter" : ""}`}
          aria-pressed={onlySaved}
          onClick={() => setOnlySaved((v) => !v)}
        >
          <Bookmark size={16} /> Mis guardados <span>{saved.length}</span>
        </button>
      </section>
      <div className="filter-pills" aria-label="Categorías de conocimiento">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={category === c ? "active" : ""}
            aria-pressed={category === c}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="results-count" role="status">
        {filtered.length}{" "}
        {filtered.length === 1 ? "guía para explorar" : "guías para explorar"}
      </div>
      <div className="knowledge-grid">
        {filtered.map((a) => (
          <article className="panel knowledge-card" key={a.id}>
            <div className="knowledge-card-top">
              <span className="quick-icon green">
                <BookOpen size={22} />
              </span>
              <button
                className={`icon-button ${saved.includes(a.id) ? "saved" : ""}`}
                onClick={() => toggleSave(a.id)}
                aria-label={`${saved.includes(a.id) ? "Quitar de" : "Añadir a"} guardados: ${a.title}`}
                aria-pressed={saved.includes(a.id)}
              >
                <Bookmark
                  size={18}
                  fill={saved.includes(a.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <span className="category-label">{a.category}</span>
            <h2>
              <Link to={`?articulo=${a.id}`}>{a.title}</Link>
            </h2>
            <p>{a.intro}</p>
            <div className="knowledge-card-bottom">
              <span>
                <Clock3 size={13} /> {a.time} min de lectura
              </span>
              <Link to={`?articulo=${a.id}`} aria-label={`Leer ${a.title}`}>
                <ArrowRight size={18} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="panel empty-state">
          <Bookmark size={30} />
          <h2>
            {onlySaved
              ? "Tu biblioteca empieza aquí"
              : "Prueba con otra búsqueda"}
          </h2>
          <p>
            {onlySaved
              ? "Marca tus guías favoritas para encontrarlas más rápido."
              : "No encontramos guías con estos filtros."}
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setOnlySaved(false);
              setTerm("");
              setCategory("Todos");
            }}
          >
            Explorar todas las guías
          </button>
        </div>
      )}
    </div>
  );
}
