import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/brand/nuevo-origen-logo.png";
import { useSession } from "./SessionProvider";

export default function LayoutPublico() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef(null);
  const location = useLocation();
  const { session, logout } = useSession();
  const [logoutError, setLogoutError] = useState("");
  const [closing, setClosing] = useState(false);
  const returnPath = encodeURIComponent(
    location.pathname + location.search + location.hash,
  );
  async function signOut() {
    setClosing(true);
    setLogoutError("");
    try {
      await logout();
    } catch {
      setLogoutError("No pudimos cerrar la sesión. Volvé a intentarlo.");
    } finally {
      setClosing(false);
    }
  }
  const accessActions = session ? (
    <>
      <Link className="button" to="/mi-espacio">
        Mi espacio
      </Link>
      <button className="text-button" disabled={closing} onClick={signOut}>
        {closing ? "Cerrando…" : "Cerrar sesión"}
      </button>
    </>
  ) : (
    <>
      <Link className="text-button" to={"/acceso?volver=" + returnPath}>
        Iniciar sesión
      </Link>
      <Link className="button" to={"/registro?volver=" + returnPath}>
        Registrar mi empresa
      </Link>
    </>
  );
  useEffect(() => {
    setMenuOpen(false);
    if (location.hash)
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [location]);
  useEffect(() => {
    if (notice && !dialog.current.open) dialog.current.showModal();
  }, [notice]);
  function pending(
    message = "Esta función estará disponible próximamente. Por ahora podés conocer la propuesta de Nuevo Origen.",
  ) {
    setMenuOpen(false);
    setNotice(message);
  }
  const navigation = (
    <>
      <Link to="/#materiales">Materiales</Link>
      <Link to="/#como-funciona">Cómo funciona</Link>
      <Link to="/#sobre-nuevo-origen">Sobre Nuevo Origen</Link>
    </>
  );
  return (
    <>
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="site-logo" to="/" aria-label="Nuevo Origen, inicio">
            <img src={logo} width="1802" height="409" alt="Nuevo Origen" />
          </Link>
          <nav className="desktop-nav" aria-label="Navegación principal">
            {navigation}
          </nav>
          <div className="desktop-actions">{accessActions}</div>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {menuOpen ? (
                <path d="m6 6 12 12M18 6 6 18" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Navegación móvil"
          hidden={!menuOpen}
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenuOpen(false);
          }}
        >
          {navigation}
          {accessActions}
        </nav>
        {logoutError && (
          <p className="page-width" role="alert">
            {logoutError}
          </p>
        )}
      </header>
      <main className="site-main" id="contenido" tabIndex="-1">
        <Outlet context={{ pending }} />
      </main>
      <footer className="site-footer">
        <div className="page-width">
          <div className="site-footer__top">
            <div className="site-footer__about">
              <Link
                className="site-logo"
                to="/"
                aria-label="Nuevo Origen, inicio"
              >
                <img src={logo} width="1802" height="409" alt="Nuevo Origen" />
              </Link>
              <p>
                Plataforma empresarial para conectar materiales aprovechables
                entre empresas y pymes mediante acuerdos trazables.
              </p>
            </div>
            <nav aria-label="Enlaces del pie de página">
              <Link to="/#materiales">Materiales</Link>
              <Link to="/#como-funciona">Cómo funciona</Link>
              <button
                onClick={() =>
                  pending(
                    "La política de privacidad definitiva todavía no está publicada.",
                  )
                }
              >
                Privacidad
              </button>
              <button
                onClick={() =>
                  pending(
                    "Los términos y la política de uso de IA definitivos todavía no están publicados.",
                  )
                }
              >
                Términos y uso de IA
              </button>
            </nav>
          </div>
          <div className="site-footer__bottom">
            <span>
              Nuevo Origen · Vista de presentación con ejemplos ficticios.
            </span>
            <span>
              Los pagos y el transporte se coordinan directamente entre las
              empresas.
            </span>
            <Link to="/estado">Estado local</Link>
          </div>
        </div>
      </footer>
      <dialog
        className="availability-dialog"
        ref={dialog}
        onClose={() => setNotice("")}
        aria-labelledby="availability-title"
      >
        <h2 id="availability-title">Todavía no está disponible</h2>
        <p>{notice}</p>
        <form method="dialog">
          <button className="button">Entendido</button>
        </form>
      </dialog>
    </>
  );
}
