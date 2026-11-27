import { NavLink } from "react-router-dom";
import { useSession } from "./SessionProvider";
export default function PrivateNav() {
  const { session } = useSession(),
    has = (p) => session.permisos.includes(p),
    company = Boolean(session.empresa);
  const links = [
    ["/mi-espacio", company ? "Mi perfil y empresa" : "Mi cuenta", true],
    ...(company && has("materiales.leer")
      ? [
          ["/mi-espacio/ofertas", "Ofertas"],
          ["/mi-espacio/necesidades", "Necesidades"],
        ]
      : []),
    ...(has("acuerdos.gestionar")
      ? [
          ["/mi-espacio/solicitudes", "Solicitudes y acuerdos"],
          ["/mi-espacio/mensajes", "Mensajes"],
        ]
      : []),
    ...(has("indicadores.operativos") || has("reportes.exportar")
      ? [["/mi-espacio/indicadores", "Indicadores"]]
      : []),
    ...(has("equipo.gestionar") ? [["/mi-espacio/equipo", "Equipo"]] : []),
    ...(has("categorias.gestionar")
      ? [["/mi-espacio/catalogos", "Catálogos"]]
      : []),
    ...(has("incidencias.supervisar") || has("incidencias.resolver_caso")
      ? [["/mi-espacio/incidencias", "Casos y moderación"]]
      : []),
    ...(has("roles_globales.gestionar")
      ? [["/mi-espacio/plataforma", "Plataforma"]]
      : []),
    ["/mi-espacio/avisos", "Avisos"],
    ...(has("ag01.usar") ? [["/mi-espacio/ia", "Centro de IA"]] : []),
    ["/mi-espacio/derechos", "Privacidad y derechos"],
  ];
  return (
    <nav className="workspace-nav" aria-label="Mi espacio">
      {links.map(([to, label, end]) => (
        <NavLink
          key={to}
          to={to}
          end={Boolean(end)}
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
