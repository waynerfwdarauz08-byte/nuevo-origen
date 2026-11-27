import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../components/SessionProvider";
import PrivateLayout from "../components/PrivateLayout";
export default function RequireSession() {
  const { session, loading, error, refresh } = useSession();
  const location = useLocation();
  if (loading)
    return (
      <section className="section" role="status">
        Consultando tu sesión…
      </section>
    );
  if (error)
    return (
      <section className="section">
        <p role="alert">{error}</p>
        <button className="button" onClick={refresh}>
          Reintentar
        </button>
      </section>
    );
  if (!session)
    return (
      <Navigate
        to={
          "/acceso?volver=" +
          encodeURIComponent(
            location.pathname + location.search + location.hash,
          )
        }
        replace
      />
    );
  return (
    <PrivateLayout>
      <Outlet />
    </PrivateLayout>
  );
}
