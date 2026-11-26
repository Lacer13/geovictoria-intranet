import { lazy, Suspense } from "react";
import { Lock } from "lucide-react";
import { signOut } from "firebase/auth";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "../auth";
import AdminLogin from "./AdminLogin";
import { useAdminAccess } from "../admin/useAdminAccess";
import { allowedModules, requestedModule } from "../admin/modules";
import AdminNavigation from "../admin/AdminNavigation";
import PasswordSetup from "../admin/PasswordSetup";
import "../admin/admin-access.css";

const AccessManagement = lazy(() => import("../admin/access/AccessManagement"));
const SecretSantaAdmin = lazy(() => import("./SecretSantaAdmin"));
const QuizAdmin = lazy(() => import("./QuizAdmin"));
const ChristmasWall = lazy(() => import("./ChristmasWall"));
const ReportsSection = lazy(() => import("../admin/ReportsSection"));
const ContentSection = lazy(() => import("../admin/ContentSection"));
const ScoresSection = lazy(() => import("../admin/ScoresSection"));

function AdminModule({ section, access }) {
  if (section === "admins") return <AccessManagement actor={access} />;
  if (section === "santa") return <SecretSantaAdmin access={access} />;
  if (section === "quiz") return <QuizAdmin />;
  if (section === "wall") return <ChristmasWall moderate />;
  if (section === "feedbacks") return <ReportsSection access={access} />;
  if (section === "news" || section === "directory")
    return <ContentSection kind={section} access={access} />;
  if (section === "scores") return <ScoresSection />;
  return null;
}

export default function Admin() {
  const { user, access, loading, error, unverifiedUser, passwordSetupUser, refreshAccess } =
    useAdminAccess();
  const [params, setParams] = useSearchParams();
  const logout = () =>
    signOut(auth).catch(() =>
      toast.error("No pudimos cerrar la sesión. Vuelve a intentarlo."),
    );
  if (passwordSetupUser && !loading)
    return <PasswordSetup user={passwordSetupUser} onSignOut={logout} onContinue={refreshAccess} />;
  if (!access || loading)
    return (
      <>
        <AdminLogin
          loading={loading}
          accessError={error}
          unverifiedUser={unverifiedUser}
          onRefresh={refreshAccess}
        />
        {user && !loading && (
          <button
            className="btn btn-secondary admin-session-exit"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        )}
      </>
    );
  const modules = allowedModules(access.permissions);
  const requested = requestedModule(params.get("seccion"));
  const selected =
    modules.find((module) => module.id === requested?.id) || modules[0];
  const choose = (id) => {
    const next = modules.find((module) => module.id === id);
    if (next) setParams({ seccion: next.query });
  };
  return (
    <div className="admin-shell page-enter">
      <header className="admin-top">
        <div>
          <h1>
            <Lock size={24} /> Panel de Administración
          </h1>
          <p>
            Conectado como: <strong>{user.email}</strong>
          </p>
          <span className="access-badge active">{access.label}</span>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Cerrar sesión
        </button>
      </header>
      {selected ? (
        <>
          <AdminNavigation
            modules={modules}
            current={selected.id}
            onChange={choose}
          />
          {requested && requested.id !== selected.id && (
            <p className="inline-notice">
              Tu perfil no tiene acceso a la sección solicitada. Mostramos una
              sección disponible para ti.
            </p>
          )}
          <Suspense
            fallback={
              <p role="status" className="admin-status">
                Abriendo la sección…
              </p>
            }
          >
            <AdminModule
              key={`${user.uid}-${selected.id}-${access.permissions.join("|")}`}
              section={selected.id}
              access={access}
            />
          </Suspense>
        </>
      ) : (
        <div className="panel empty-state">
          <h2>Tu perfil no tiene secciones disponibles</h2>
          <p>Consulta con la persona responsable de los accesos.</p>
        </div>
      )}
    </div>
  );
}
