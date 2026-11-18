import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Heart, LoaderCircle, TriangleAlert } from "lucide-react";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import DynamicHeader from "./components/DynamicHeader";
import ChristmasEffects from "./components/ChristmasEffects";
import { isLocalDemo } from "./firebase";
import { PortalProvider } from "./context/PortalContext";
import { readPreference, savePreference } from "./lib/preferences";
import { rememberWelcome, shouldShowWelcome } from "./lib/welcome";
import LoadingScreen from "./components/LoadingScreen";

const GamePage = lazy(() => import("./components/GamePage"));
const OrgChart = lazy(() => import("./components/OrgChart"));
const HelpDirectory = lazy(() => import("./components/HelpDirectory"));
const Wiki = lazy(() => import("./components/Wiki"));
const Admin = lazy(() => import("./components/Admin"));
const SearchPage = lazy(() => import("./components/SearchPage"));
const NewsPage = lazy(() => import("./components/NewsPage"));
const Christmas = lazy(() => import("./components/Christmas"));
const FeedbackForm = lazy(() => import("./components/FeedbackForm"));
const SecretSanta = lazy(() => import("./components/SecretSanta"));
const SecretSantaReveal = lazy(() =>
  import("./components/SecretSanta").then((module) => ({
    default: module.SecretSantaReveal,
  })),
);

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="page-error">
          <TriangleAlert size={36} />
          <h1>No pudimos abrir esta página</h1>
          <p>Recarga la intranet para volver a intentarlo.</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      );
    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const [welcomeOpen, setWelcomeOpen] = useState(() =>
    shouldShowWelcome(location.pathname),
  );
  const closeWelcome = useCallback(() => {
    rememberWelcome();
    setWelcomeOpen(false);
  }, []);
  const [isLightMode, setLightMode] = useState(
    () => readPreference("geoTheme", "light") !== "dark",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [festive, setFestive] = useState(
    () => readPreference("geoChristmasMotion", "on") !== "off",
  );
  const toggleFestive = () =>
    setFestive((value) => {
      savePreference("geoChristmasMotion", value ? "off" : "on");
      return !value;
    });
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openWelcome = useCallback(() => {
    setMenuOpen(false);
    setWelcomeOpen(true);
  }, []);
  const game = location.pathname === "/juego";
  useEffect(() => {
    document.body.classList.toggle("light-mode", isLightMode);
    document.documentElement.style.colorScheme = isLightMode ? "light" : "dark";
    savePreference("geoTheme", isLightMode ? "light" : "dark");
  }, [isLightMode]);
  useEffect(() => {
    if (document.querySelector(".victoria-welcome-modal")) return;
    window.scrollTo({ top: 0 });
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <div className={game ? "game-shell" : "app-shell"}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: "start" });
        }}
      >
        Saltar al contenido
      </a>
      {!game && (
        <Sidebar open={menuOpen} onClose={closeMenu} onWelcome={openWelcome} />
      )}
      <div className="app-body" inert={menuOpen || undefined}>
        {!game && <ChristmasEffects enabled={festive} />}
        {!game && (
          <DynamicHeader
            isLightMode={isLightMode}
            toggleTheme={() => setLightMode((v) => !v)}
            festive={festive}
            toggleFestive={toggleFestive}
            onMenu={() => setMenuOpen((v) => !v)}
            menuOpen={menuOpen}
          />
        )}
        <main
          id="main-content"
          className={game ? "game-main" : "main-content"}
          tabIndex={-1}
        >
          {isLocalDemo && (
            <div className="inline-notice" role="status">
              Entorno de pruebas local · Datos de ejemplo sin conexión a
              producción
            </div>
          )}
          <ErrorBoundary key={location.pathname}>
            <Suspense
              fallback={
                <div className="route-loading" role="status">
                  <LoaderCircle className="animate-spin" /> Abriendo tu espacio…
                </div>
              }
            >
              <Routes>
                <Route
                  path="/"
                  element={<Dashboard onWelcome={openWelcome} />}
                />
                <Route path="/juego" element={<GamePage />} />
                <Route path="/organigrama" element={<OrgChart />} />
                <Route path="/directorio" element={<HelpDirectory />} />
                <Route path="/wiki" element={<Wiki />} />
                <Route path="/buscar" element={<SearchPage />} />
                <Route path="/novedades" element={<NewsPage />} />
                <Route path="/navidad" element={<Christmas />} />
                <Route path="/amigo-secreto" element={<SecretSanta />} />
                <Route
                  path="/amigo-secreto/ver"
                  element={<SecretSantaReveal />}
                />
                <Route path="/solicitudes" element={<FeedbackForm />} />
                <Route path="/admin" element={<Admin />} />
                <Route
                  path="*"
                  element={
                    <div className="page-error">
                      <span className="eyebrow">
                        404 · TE AYUDAMOS A VOLVER
                      </span>
                      <h1>Esta página no está por aquí</h1>
                      <p>
                        Encuentra tus herramientas en el inicio de la intranet.
                      </p>
                      <Link to="/" className="btn btn-primary">
                        Volver al inicio
                      </Link>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        {!game && (
          <footer className="app-footer">
            <span>
              GeoVictoria <span className="footer-dot">·</span> Conectados somos
              más.
            </span>
            <span>
              Hecho para nuestro equipo <Heart size={12} />{" "}
              <span className="footer-dot">·</span> Perú
            </span>
          </footer>
        )}
      </div>
      {welcomeOpen && (
        <LoadingScreen onComplete={closeWelcome} motionAllowed={festive} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PortalProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--surface-color)",
              color: "var(--text-main)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
            },
          }}
        />
        <AppContent />
      </PortalProvider>
    </BrowserRouter>
  );
}
