import React, { useState, useEffect, useCallback } from "react";
import {
  Lock,
  Inbox,
  Trash2,
  Megaphone,
  Users,
  ShieldCheck,
  Gift,
  Trophy,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../auth";
import { onIdTokenChanged, signOut, getIdTokenResult } from "firebase/auth";
import toast from "react-hot-toast";
import AdminLogin from "./AdminLogin";
import AdminManagers from "./AdminManagers";
import SecretSantaAdmin from "./SecretSantaAdmin";
import ContentManager from "./ContentManager";
import QuizAdmin from "./QuizAdmin";

const Admin = () => {
  const [params] = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() =>
    params.get("seccion") === "concurso"
      ? "quiz"
      : params.get("seccion") === "amigo-secreto"
        ? "santa"
        : "feedbacks",
  );

  // Data states
  const [messages, setMessages] = useState([]);
  const [news, setNews] = useState([]);
  const [directory, setDirectory] = useState([]);

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
    let mounted = true;
    let generation = 0;
    let stopRole = () => {};
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const current = ++generation;
      stopRole();
      stopRole = () => {};
      const valid = () => mounted && current === generation;
      const grant = async () => {
        if (!valid()) return;
        setEmail(user.email || "");
        setUnverifiedUser(null);
        setDataLoading(true);
        setDataError("");
        setError("");
        setIsAuthenticated(true);
        setAuthLoading(false);
        await Promise.all([loadMessages(), loadNews(), loadDirectory()]);
        if (valid()) setDataLoading(false);
      };
      if (!user) {
        if (valid()) {
          setIsAuthenticated(false);
          setUnverifiedUser(null);
          setMessages([]);
          setNews([]);
          setDirectory([]);
          setAuthLoading(false);
        }
        return;
      }
      try {
        const token = await getIdTokenResult(user);
        if (!valid()) return;
        if (token.claims.admin === true) {
          await grant();
          return;
        }
        if (!user.emailVerified) {
          setIsAuthenticated(false);
          setUnverifiedUser(user);
          setError("");
          setAuthLoading(false);
          return;
        }
        if (!user.email) throw new Error("An email is required");
        stopRole = onSnapshot(
          doc(db, "administrators", user.email.toLowerCase()),
          (snapshot) => {
            if (!valid()) return;
            const role = snapshot.data();
            if (
              snapshot.exists() &&
              role.active === true &&
              ["owner", "admin"].includes(role.role)
            )
              void grant();
            else {
              setIsAuthenticated(false);
              setError(
                "Este correo no tiene acceso de administrador. Solicita autorización al responsable del portal.",
              );
              setAuthLoading(false);
              void signOut(auth);
            }
          },
          () => {
            if (valid()) {
              setIsAuthenticated(false);
              setError(
                "No pudimos comprobar los permisos. Vuelve a iniciar sesión.",
              );
              setAuthLoading(false);
            }
          },
        );
      } catch {
        if (valid()) {
          setIsAuthenticated(false);
          setError("No pudimos verificar tu acceso. Vuelve a intentarlo.");
          setAuthLoading(false);
        }
      }
    });
    return () => {
      mounted = false;
      generation++;
      stopRole();
      unsubscribe();
    };
  }, [loadMessages, loadNews, loadDirectory]);

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

  if (!isAuthenticated) {
    return (
      <AdminLogin
        loading={authLoading}
        accessError={error}
        unverifiedUser={unverifiedUser}
      />
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
              <Lock color="var(--festive-gold)" /> Panel de Administración
            </h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              Conectado como:{" "}
              <span style={{ color: "var(--forest)" }}>{email}</span>
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
      <label className="admin-section-select">
        Sección de administración
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="feedbacks">Buzón de reportes</option>
          <option value="news">Noticias</option>
          <option value="directory">Directorio de soporte</option>
          <option value="admins">Administradores</option>
          <option value="santa">Amigo secreto</option>
          <option value="quiz">Concurso en vivo</option>
        </select>
      </label>
      <div className="admin-tabs" aria-label="Secciones de administración">
        <button
          onClick={() => setActiveTab("feedbacks")}
          className={`btn ${activeTab === "feedbacks" ? "btn-forest" : "btn-secondary"}`}
          aria-pressed={activeTab === "feedbacks"}
        >
          <Inbox size={18} /> Buzón de Reportes
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`btn ${activeTab === "news" ? "btn-forest" : "btn-secondary"}`}
          aria-pressed={activeTab === "news"}
        >
          <Megaphone size={18} /> Gestor de Noticias
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`btn ${activeTab === "directory" ? "btn-forest" : "btn-secondary"}`}
          aria-pressed={activeTab === "directory"}
        >
          <Users size={18} /> Directorio de Soporte
        </button>
        <button
          className={`btn ${activeTab === "admins" ? "btn-forest" : "btn-secondary"}`}
          onClick={() => setActiveTab("admins")}
          aria-pressed={activeTab === "admins"}
        >
          <ShieldCheck size={18} /> Administradores
        </button>
        <button
          className={`btn ${activeTab === "santa" ? "btn-forest" : "btn-secondary"}`}
          onClick={() => setActiveTab("santa")}
          aria-pressed={activeTab === "santa"}
        >
          <Gift size={18} /> Amigo secreto
        </button>
        <button
          className={`btn ${activeTab === "quiz" ? "btn-forest" : "btn-secondary"}`}
          onClick={() => setActiveTab("quiz")}
          aria-pressed={activeTab === "quiz"}
        >
          <Trophy size={18} /> Concurso en vivo
        </button>
      </div>

      {activeTab === "admins" && <AdminManagers />}
      {activeTab === "santa" && <SecretSantaAdmin />}
      {activeTab === "quiz" && <QuizAdmin />}

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

      {activeTab === "news" && (
        <ContentManager
          key="news"
          kind="news"
          items={news}
          onSavedRecord={(record) =>
            setNews((previous) =>
              [
                record,
                ...previous.filter((item) => item.id !== record.id),
              ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            )
          }
          onDelete={handleDeleteNews}
        />
      )}
      {activeTab === "directory" && (
        <ContentManager
          key="directory"
          kind="directory"
          items={directory}
          onSavedRecord={(record) =>
            setDirectory((previous) =>
              [
                record,
                ...previous.filter((item) => item.id !== record.id),
              ].sort((a, b) => a.department.localeCompare(b.department, "es")),
            )
          }
          onDelete={handleDeleteDirectory}
        />
      )}
    </div>
  );
};

export default Admin;
