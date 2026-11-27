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
import Catalogo from "../pages/Catalogo.jsx";
import MaterialDetalle from "../pages/MaterialDetalle.jsx";
import EmpresaPublica from "../pages/EmpresaPublica.jsx";
import MisMateriales from "../pages/MisMateriales.jsx";
import MaterialFormulario from "../pages/MaterialFormulario.jsx";
import AdministrarCatalogos from "../pages/AdministrarCatalogos.jsx";
import Solicitudes, {
  CrearSolicitud,
  SolicitudDetalle,
} from "../pages/Solicitudes.jsx";
import AcuerdoDetalle from "../pages/AcuerdoDetalle.jsx";
import Indicadores from "../pages/Indicadores.jsx";
import Avisos from "../pages/Avisos.jsx";
import Incidencias from "../pages/Incidencias.jsx";
import Derechos, { Recuperacion, Restablecer } from "../pages/Derechos.jsx";
import Plataforma from "../pages/Plataforma.jsx";
import Mensajeria from "../pages/Mensajeria.jsx";
import CentroIA from "../pages/CentroIA.jsx";
export default function AppRouter() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<LayoutPublico />}>
            <Route index element={<Inicio />} />
            <Route path="estado" element={<Estado />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="materiales/:id" element={<MaterialDetalle />} />
            <Route path="empresas/:id" element={<EmpresaPublica />} />
            <Route path="acceso" element={<Acceso />} />
            <Route path="recuperacion" element={<Recuperacion />} />
            <Route path="restablecer" element={<Restablecer />} />
            <Route path="registro" element={<Registro />} />
            <Route path="aceptar-invitacion" element={<AceptarInvitacion />} />
            <Route path="politicas/:tipo" element={<PoliticaLocal />} />
            <Route element={<RequireSession />}>
              <Route path="mi-espacio/ia" element={<CentroIA />} />
              <Route path="mi-espacio/mensajes" element={<Mensajeria />} />
              <Route path="mi-espacio/mensajes/:id" element={<Mensajeria />} />
              <Route path="mi-espacio/incidencias" element={<Incidencias />} />
              <Route path="mi-espacio/derechos" element={<Derechos />} />
              <Route path="mi-espacio/plataforma" element={<Plataforma />} />
              <Route path="mi-espacio/solicitudes" element={<Solicitudes />} />
              <Route
                path="mi-espacio/solicitudes/nueva"
                element={<CrearSolicitud />}
              />
              <Route
                path="mi-espacio/solicitudes/:id"
                element={<SolicitudDetalle />}
              />
              <Route
                path="mi-espacio/acuerdos/:id"
                element={<AcuerdoDetalle />}
              />
              <Route path="mi-espacio/indicadores" element={<Indicadores />} />
              <Route path="mi-espacio/avisos" element={<Avisos />} />
              <Route path="mi-espacio" element={<EspacioPrivado />} />
              <Route path="mi-espacio/equipo" element={<Equipo />} />
              <Route
                path="mi-espacio/ofertas"
                element={<MisMateriales key="ofertas" kind="oferta" />}
              />
              <Route
                path="mi-espacio/ofertas/nueva"
                element={
                  <MaterialFormulario key="oferta-nueva" kind="oferta" />
                }
              />
              <Route
                path="mi-espacio/ofertas/:id"
                element={<MaterialFormulario kind="oferta" />}
              />
              <Route
                path="mi-espacio/necesidades"
                element={<MisMateriales key="necesidades" kind="necesidad" />}
              />
              <Route
                path="mi-espacio/necesidades/nueva"
                element={
                  <MaterialFormulario key="necesidad-nueva" kind="necesidad" />
                }
              />
              <Route
                path="mi-espacio/necesidades/:id"
                element={<MaterialFormulario kind="necesidad" />}
              />
              <Route
                path="mi-espacio/catalogos"
                element={<AdministrarCatalogos />}
              />
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
