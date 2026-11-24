import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LayoutPublico from "../components/LayoutPublico.jsx";
import Inicio from "../pages/Inicio.jsx";
import Estado from "../pages/Estado.jsx";
import SessionProvider from "../components/SessionProvider.jsx";
import RequireSession from "./RequireSession.jsx";
import Acceso from "../pages/Acceso.jsx";
import Registro from "../pages/Registro.jsx";
import EspacioPrivado from "../pages/EspacioPrivado.jsx";
import PoliticaLocal from "../pages/PoliticaLocal.jsx";
import Equipo from "../pages/Equipo.jsx";
import AceptarInvitacion from "../pages/AceptarInvitacion.jsx";
export default function AppRouter() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<LayoutPublico />}>
            <Route index element={<Inicio />} />
            <Route path="estado" element={<Estado />} />
            <Route path="acceso" element={<Acceso />} />
            <Route path="registro" element={<Registro />} />
            <Route path="aceptar-invitacion" element={<AceptarInvitacion />} />
            <Route path="politicas/:tipo" element={<PoliticaLocal />} />
            <Route element={<RequireSession />}>
              <Route path="mi-espacio" element={<EspacioPrivado />} />
              <Route path="mi-espacio/equipo" element={<Equipo />} />
            </Route>
            <Route
              path="*"
              element={
                <section className="section">
                  <h1>No encontramos esta página</h1>
                  <Link to="/">Volver al inicio</Link>
                </section>
              }
            />
          </Route>
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
