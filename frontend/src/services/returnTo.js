export function safeReturn(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n]/.test(value)
  )
    return "/mi-espacio";
  try {
    const url = new URL(value, "https://local.invalid");
    if (
      url.origin !== "https://local.invalid" ||
      !(
        [
          "/",
          "/estado",
          "/mi-espacio",
          "/mi-espacio/equipo",
          "/catalogo",
          "/mi-espacio/catalogos",
          "/mi-espacio/incidencias",
          "/mi-espacio/derechos",
          "/mi-espacio/plataforma",
          "/mi-espacio/solicitudes",
          "/mi-espacio/solicitudes/nueva",
          "/mi-espacio/indicadores",
          "/mi-espacio/avisos",
          "/mi-espacio/mensajes",
        ].includes(url.pathname) ||
        /^\/(materiales|empresas)\/[1-9]\d*$/.test(url.pathname) ||
        /^\/mi-espacio\/(solicitudes|acuerdos|mensajes)\/[1-9]\d*$/.test(
          url.pathname,
        ) ||
        /^\/mi-espacio\/(ofertas|necesidades)(\/(nueva|[1-9]\d*))?$/.test(
          url.pathname,
        )
      )
    )
      return "/mi-espacio";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/mi-espacio";
  }
}
