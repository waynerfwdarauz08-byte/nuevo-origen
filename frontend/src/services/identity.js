const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export async function api(path, { method = "GET", body, signal } = {}) {
  const timeout = AbortSignal.timeout(15000);
  signal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const target = new URL(base + path, window.location.origin);
  if (target.origin !== window.location.origin)
    throw new ApiError(
      "La API debe usar el mismo origen mediante el proxy local.",
      0,
      "API_ORIGIN",
    );
  const headers = { Accept: "application/json" };
  if (method !== "GET") {
    const challenge = await fetch(base + "/auth/csrf", {
      credentials: "same-origin",
      signal,
      headers: { Accept: "application/json" },
    });
    if (!challenge.ok)
      throw new ApiError(
        "No pudimos verificar la solicitud. Volvé a intentarlo.",
        challenge.status,
        "CSRF",
      );
    headers["X-CSRF-Token"] = (await challenge.json()).csrfToken;
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(target, {
    method,
    credentials: "same-origin",
    signal,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    if (
      response.status === 401 &&
      !["/auth/login", "/auth/sesion"].includes(path)
    )
      window.dispatchEvent(new Event("session-ended"));
    throw new ApiError(
      data.error?.message || "No pudimos completar la solicitud.",
      response.status,
      data.error?.code,
    );
  }
  return data;
}
