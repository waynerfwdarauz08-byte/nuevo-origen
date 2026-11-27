import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "./SessionProvider";
import PrivateNav from "./PrivateNav";
export default function PrivateLayout({ children }) {
  const { session } = useSession(),
    { pathname } = useLocation(),
    content = useRef(null),
    previous = useRef(pathname);
  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      content.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    }
  }, [pathname]);
  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <div className="workspace-identity">
          <span className="workspace-avatar" aria-hidden="true">
            {session.usuario.nombre.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>
              {session.empresa?.nombre || "Gestión de plataforma"}
            </strong>
            <span>{session.usuario.nombre}</span>
          </div>
        </div>
        <PrivateNav />
      </aside>
      <div
        className="workspace-content"
        ref={content}
        tabIndex={-1}
        role="region"
        aria-label="Contenido de mi espacio"
      >
        {children}
      </div>
    </div>
  );
}
