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
      !["/", "/estado", "/mi-espacio", "/mi-espacio/equipo"].includes(
        url.pathname,
      )
    )
      return "/mi-espacio";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/mi-espacio";
  }
}
