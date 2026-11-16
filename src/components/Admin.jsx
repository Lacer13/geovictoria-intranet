import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Lock,
  Inbox,
  Trash2,
  Megaphone,
  Plus,
  Star,
  Calendar,
  Users,
} from "lucide-react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  getIdTokenResult,
} from "firebase/auth";
import toast from "react-hot-toast";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("feedbacks"); // 'feedbacks', 'news', 'directory'

  // Data states
  const [messages, setMessages] = useState([]);
  const [news, setNews] = useState([]);
  const [directory, setDirectory] = useState([]);

  // Form states for News
  const [newsTitle, setNewsTitle] = useState("");
  const [newsDesc, setNewsDesc] = useState("");
  const [newsType, setNewsType] = useState("anuncio");

  // Form states for Directory
  const [dirDept, setDirDept] = useState("");
  const [dirName, setDirName] = useState("");
  const [dirEmail, setDirEmail] = useState("");
  const [dirColor, setDirColor] = useState("#1e90ff");

  const loadDirectory = useCallback(async () => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, "directory"));
        const dirs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort alphabetically by department
        dirs.sort((a, b) =>
          String(a.department || "").localeCompare(
            String(b.department || ""),
            "es",
          ),
        );
        setDirectory(dirs);
      } catch (err) {
        console.error("Error cargando directorio:", err);
        setDataError(
          "No pudimos cargar el directorio. Revisa tu conexión y los permisos de tu cuenta.",
        );
      }
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, "feedbacks"));
        const msgs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        msgs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMessages(msgs);
      } catch (err) {
        console.error("Error cargando feedbacks:", err);
        setDataError(
          "No pudimos cargar el buzón. Revisa tu conexión y los permisos de tu cuenta.",
        );
      }
    }
  }, []);

  const loadNews = useCallback(async () => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, "news"));
        const newsItems = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        newsItems.sort(
          (a, b) =>
            new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date),
        );
        setNews(newsItems);
      } catch (err) {
        console.error("Error cargando noticias:", err);
        setDataError(
          "No pudimos cargar las noticias. Revisa tu conexión y los permisos de tu cuenta.",
        );
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const token = await getIdTokenResult(user);
          if (!active) return;
          if (token.claims.admin === true) {
            setEmail(user.email || "");
            setDataLoading(true);
            setDataError("");
            setIsAuthenticated(true);
            await Promise.all([loadMessages(), loadNews(), loadDirectory()]);
            if (active) setDataLoading(false);
          } else {
            setIsAuthenticated(false);
            setError("Esta cuenta no tiene permisos de administración.");
            await signOut(auth);
          }
        } else if (active) {
          setIsAuthenticated(false);
          setMessages([]);
          setNews([]);
          setDirectory([]);
        }
      } catch {
        if (active)
          setError(
            "No pudimos verificar los permisos. Vuelve a iniciar sesión.",
          );
      } finally {
        if (active) setAuthLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadMessages, loadNews, loadDirectory]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch {
      setError(
        "No pudimos iniciar sesión. Verifica tus credenciales y tu conexión.",
      );
      setAuthLoading(false);
    }
  };

  const handleDeleteFeedback = (msgId) => {
    toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0 }}>¿Estás seguro de eliminar este reporte?</p>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn"
              onClick={() => toast.dismiss(t.id)}
              style={{ padding: "0.5rem", fontSize: "0.9rem" }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{
                padding: "0.5rem",
                fontSize: "0.9rem",
                background: "#ff4757",
                borderColor: "#ff4757",
              }}
              onClick={async () => {
                toast.dismiss(t.id);
                if (db && msgId) {
                  try {
                    await deleteDoc(doc(db, "feedbacks", msgId));
                    loadMessages();
                    toast.success("Reporte eliminado.");
                  } catch {
                    toast.error("Error eliminando documento.");
                  }
                }
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleDeleteNews = (newsId) => {
    toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0 }}>¿Estás seguro de eliminar esta noticia?</p>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn"
              onClick={() => toast.dismiss(t.id)}
              style={{ padding: "0.5rem", fontSize: "0.9rem" }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{
                padding: "0.5rem",
                fontSize: "0.9rem",
                background: "#ff4757",
                borderColor: "#ff4757",
              }}
              onClick={async () => {
                toast.dismiss(t.id);
                if (db && newsId) {
                  try {
                    await deleteDoc(doc(db, "news", newsId));
                    loadNews();
                    toast.success("Noticia eliminada.");
                  } catch {
                    toast.error("Error eliminando noticia.");
                  }
                }
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!db || saving || !newsTitle.trim() || !newsDesc.trim()) return;
    setSaving(true);
    try {
      const now = new Date();
      await addDoc(collection(db, "news"), {
        title: newsTitle.trim(),
        desc: newsDesc.trim(),
        type: newsType,
        date:
          now.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) +
          " " +
          now.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        timestamp: now.toISOString(),
      });
      setNewsTitle("");
      setNewsDesc("");
      loadNews();
      toast.success("Noticia publicada exitosamente.");
    } catch (err) {
      console.error("Error agregando noticia:", err);
      toast.error("Hubo un error al publicar la noticia.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDirectory = async (e) => {
    e.preventDefault();
    if (saving || !dirDept.trim() || !dirName.trim() || !dirEmail.trim())
      return;
    setSaving(true);

    try {
      await addDoc(collection(db, "directory"), {
        department: dirDept.trim(),
        name: dirName.trim(),
        email: dirEmail.trim(),
        color: dirColor,
      });
      setDirDept("");
      setDirName("");
      setDirEmail("");
      loadDirectory();
      toast.success("Contacto agregado al directorio.");
    } catch (err) {
      console.error("Error agregando contacto:", err);
      toast.error("Hubo un error al agregar el contacto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDirectory = (dirId) => {
    toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0 }}>
            ¿Estás seguro de eliminar este contacto del directorio?
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn"
              onClick={() => toast.dismiss(t.id)}
              style={{ padding: "0.5rem", fontSize: "0.9rem" }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{
                padding: "0.5rem",
                fontSize: "0.9rem",
                background: "#ff4757",
                borderColor: "#ff4757",
              }}
              onClick={async () => {
                toast.dismiss(t.id);
                if (db && dirId) {
                  try {
                    await deleteDoc(doc(db, "directory", dirId));
                    loadDirectory();
                    toast.success("Contacto eliminado.");
                  } catch {
                    toast.error("Error eliminando contacto.");
                  }
                }
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const renderIconForNews = (type) => {
    switch (type) {
      case "logro":
        return <Star color="#ffa502" size={20} />;
      case "cumpleaños":
        return <Calendar color="#ff4757" size={20} />;
      default:
        return <Megaphone color="#1e90ff" size={20} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="panel admin-login page-enter">
        <span className="quick-icon green">
          <Lock size={24} />
        </span>
        <span className="eyebrow">ADMINISTRACIÓN</span>
        <h1>Cuidamos este espacio.</h1>
        <p>
          Ingresa con tu cuenta autorizada para gestionar los comunicados,
          contactos y solicitudes del equipo.
        </p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="admin-email">Correo de trabajo</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="nombre@geovictoria.com"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={authLoading}
            />
          </div>
          <div className="input-group">
            <label htmlFor="admin-password">Contraseña</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={authLoading}
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-forest"
            disabled={authLoading}
          >
            {authLoading ? "Verificando acceso…" : "Entrar a administración"}
            <ArrowLeft size={15} style={{ transform: "rotate(180deg)" }} />
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 10 }}>
          Si necesitas acceso o recuperar tu cuenta, consulta con el responsable
          de la intranet.
        </p>
      </section>
    );
  }

  return (
    <div
      className="container animate-fade-in"
      style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
    >
      {/* Admin Header */}
      <div className="admin-top">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1
              style={{
                color: "var(--text-main)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Lock color="#ffa502" /> Panel de Administración
            </h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              Conectado como: <span style={{ color: "#ffa502" }}>{email}</span>
            </p>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() =>
            signOut(auth).catch(() =>
              toast.error("No pudimos cerrar la sesión. Vuelve a intentarlo."),
            )
          }
        >
          Cerrar sesión
        </button>
      </div>

      {dataLoading && (
        <p className="admin-status" role="status">
          Cargando información…
        </p>
      )}
      {dataError && (
        <div className="form-error" role="alert">
          {dataError}{" "}
          <button
            className="text-link"
            onClick={() => {
              setDataError("");
              loadMessages();
              loadNews();
              loadDirectory();
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab("feedbacks")}
          className="btn"
          style={{
            background:
              activeTab === "feedbacks"
                ? "var(--geo-primary-light)"
                : "transparent",
            color: activeTab === "feedbacks" ? "white" : "var(--text-muted)",
          }}
        >
          <Inbox size={18} /> Buzón de Reportes
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className="btn"
          style={{
            background:
              activeTab === "news" ? "var(--geo-secondary)" : "transparent",
            color: activeTab === "news" ? "white" : "var(--text-muted)",
          }}
        >
          <Megaphone size={18} /> Gestor de Noticias
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className="btn"
          style={{
            background: activeTab === "directory" ? "#ffa502" : "transparent",
            color: activeTab === "directory" ? "white" : "var(--text-muted)",
          }}
        >
          <Users size={18} /> Directorio de Soporte
        </button>
      </div>

      {/* Tab Content: Feedbacks */}
      {activeTab === "feedbacks" && (
        <>
          {messages.length === 0 && !dataLoading && !dataError ? (
            <div
              className="glass-panel"
              style={{ padding: "4rem", textAlign: "center" }}
            >
              <Inbox
                size={64}
                color="var(--text-muted)"
                style={{ margin: "0 auto 1rem auto", opacity: 0.5 }}
              />
              <h2 style={{ color: "var(--text-main)" }}>Bandeja Vacía</h2>
              <p style={{ color: "var(--text-muted)" }}>
                No hay nuevas solicitudes o reportes en este momento.
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className="glass-panel"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    borderLeft: msg.isAnonymous
                      ? "4px solid #ff4757"
                      : "4px solid #1e90ff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "1rem",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          color: "var(--text-main)",
                          margin: "0 0 0.3rem 0",
                          fontSize: "1.2rem",
                        }}
                      >
                        {msg.isAnonymous
                          ? "🕵️ Reporte Anónimo"
                          : `👤 De: ${msg.name}`}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {!msg.isAnonymous && (
                          <span>
                            <strong>Depto:</strong> {msg.department}
                          </span>
                        )}
                        <span>
                          <strong>Fecha:</strong>{" "}
                          {new Date(msg.date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFeedback(msg.id)}
                      className="btn btn-secondary"
                      style={{
                        padding: "0.5rem",
                        color: "#ff4757",
                        borderColor: "transparent",
                      }}
                      title="Eliminar mensaje"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div
                    style={{
                      color: "var(--text-main)",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab Content: News */}
      {activeTab === "news" && (
        <div className="admin-grid">
          {/* Create News Form */}
          <div
            className="glass-panel"
            style={{ padding: "1.5rem", height: "fit-content" }}
          >
            <h2
              style={{
                color: "var(--text-main)",
                margin: "0 0 1rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Plus color="var(--geo-secondary)" /> Nueva Noticia
            </h2>
            <form
              onSubmit={handleAddNews}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="input-group">
                <label className="input-label">Título Breve</label>
                <input
                  type="text"
                  className="input-field"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  required
                  maxLength={50}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Tipo de Anuncio</label>
                <select
                  className="input-field"
                  value={newsType}
                  onChange={(e) => setNewsType(e.target.value)}
                  style={{
                    background: "var(--glass-bg)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="anuncio">Anuncio General / Informativo</option>
                  <option value="logro">Logro / Hito Corporativo</option>
                  <option value="cumpleaños">Celebración / Cumpleaños</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Descripción Detallada</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={newsDesc}
                  onChange={(e) => setNewsDesc(e.target.value)}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-forest"
              >
                {saving ? "Publicando…" : "Publicar noticia"}
              </button>
            </form>
          </div>

          {/* Existing News List */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <h2 style={{ color: "var(--text-main)", margin: 0 }}>
              Noticias Publicadas
            </h2>
            {news.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>
                No hay noticias publicadas.
              </p>
            ) : (
              news.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    borderLeft: "3px solid var(--geo-secondary)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {renderIconForNews(item.type)}
                      <h4 style={{ color: "var(--text-main)", margin: 0 }}>
                        {item.title}
                      </h4>
                    </div>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        margin: "0 0 0.5rem 0",
                        fontSize: "0.9rem",
                      }}
                    >
                      {item.desc}
                    </p>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--geo-secondary)",
                      }}
                    >
                      {item.date}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNews(item.id)}
                    className="btn btn-secondary"
                    style={{
                      padding: "0.5rem",
                      color: "#ff4757",
                      borderColor: "transparent",
                    }}
                    title="Eliminar noticia"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Directory */}
      {activeTab === "directory" && (
        <div className="admin-grid">
          {/* Create Contact Form */}
          <div
            className="glass-panel"
            style={{ padding: "1.5rem", height: "fit-content" }}
          >
            <h2
              style={{
                color: "var(--text-main)",
                margin: "0 0 1rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Plus color="#ffa502" /> Nuevo Contacto
            </h2>
            <form
              onSubmit={handleAddDirectory}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="input-group">
                <label className="input-label">Área / Puesto</label>
                <input
                  type="text"
                  className="input-field"
                  value={dirDept}
                  onChange={(e) => setDirDept(e.target.value)}
                  required
                  placeholder="Ej: Comercial, Country Manager..."
                />
              </div>
              <div className="input-group">
                <label className="input-label">Nombre del Responsable</label>
                <input
                  type="text"
                  className="input-field"
                  value={dirName}
                  onChange={(e) => setDirName(e.target.value)}
                  required
                  placeholder="Ej: Diego Bendezu"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="input-field"
                  value={dirEmail}
                  onChange={(e) => setDirEmail(e.target.value)}
                  required
                  placeholder="Ej: dbendezu@geovictoria.com"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Color Distintivo</label>
                <select
                  className="input-field"
                  value={dirColor}
                  onChange={(e) => setDirColor(e.target.value)}
                  style={{
                    background: "var(--glass-bg)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="#1e90ff">Azul Tecnológico</option>
                  <option value="#ffa502">Naranja Alerta</option>
                  <option value="#ff4757">Rojo Crítico</option>
                  <option value="#2ed573">Verde Operativo</option>
                  <option value="#00c4cc">Cyan Moderno</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-forest"
              >
                {saving ? "Guardando…" : "Guardar contacto"}
              </button>
            </form>
          </div>

          {/* Existing Contacts List */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <h2 style={{ color: "var(--text-main)", margin: 0 }}>
              Directorio Actual
            </h2>
            {directory.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>
                No hay contactos en el directorio.
              </p>
            ) : (
              directory.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: `4px solid ${item.color}`,
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: item.color,
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        margin: "0 0 0.3rem 0",
                      }}
                    >
                      {item.department}
                    </p>
                    <h4
                      style={{
                        color: "var(--text-main)",
                        margin: "0 0 0.3rem 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      👤 {item.name}
                    </h4>
                    <span
                      style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}
                    >
                      ✉️ {item.email}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteDirectory(item.id)}
                    className="btn btn-secondary"
                    style={{
                      padding: "0.5rem",
                      color: "#ff4757",
                      borderColor: "transparent",
                    }}
                    title="Eliminar contacto"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
